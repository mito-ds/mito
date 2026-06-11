/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { type Root } from 'react-dom/client';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { CodeCell, MarkdownCell } from '@jupyterlab/cells';
import { Compartment, StateEffect } from '@codemirror/state';
import { commentSelectionExtension, COMMENT_TOOLTIP_CLICK_EVENT, VERIFIED_SNIPPET_TOOLTIP_CLICK_EVENT, CommentTooltipClickDetail, dismissCommentTooltip } from './AddCommentBubble';
import { addVerifiedSnippet, getVerifiedReports, VerifiedReportListItem } from '../../restAPI/RestAPI';
import { slugifyRuleName } from '../../utils/fileName';
import { COMMAND_MITO_AI_OPEN_SETTINGS_VERIFIED_REPORTS } from '../../commands';
import { Notification } from '@jupyterlab/apputils';
import { commentGutterIndicator, CommentLineRange, COMMENT_INDICATOR_CLICK_EVENT, CommentIndicatorClickDetail } from './CommentGutterIndicator';
import {
    COMMAND_MITO_AI_ADD_CODE_COMMENT,
    COMMAND_MITO_AI_ADD_OUTPUT_COMMENT,
    COMMAND_MITO_AI_ADD_DOCUMENT_COMMENT_THREAD,
    COMMAND_MITO_AI_UPDATE_COMMENT_INDICATORS,
    COMMAND_MITO_AI_REMOVE_CODE_COMMENT,
    COMMAND_MITO_AI_REMOVE_OUTPUT_COMMENT,
} from '../../commands';
import { getCellNumberById } from '../../utils/cellReferences';
import { UUID } from '@lumino/coreutils';
import { ICellModel } from '@jupyterlab/cells';
import { IContextManager } from '../ContextManager/ContextManagerPlugin';
import { getAIOptimizedCellsInNotebookPanel } from '../../utils/notebook';
import { getCellOutputByIDInNotebook } from '../../utils/cellOutput';
import {
    addDocumentCommentThread,
    getDocumentCommentThreads,
    IDocumentCommentThread,
    normalizeInterruptedThreads,
    removeDocumentCommentThread,
    updateDocumentCommentThread,
} from '../../utils/documentCommentMetadata';
import { CommentInstantAnswerService } from './commentInstantAnswerService';
import { ICommentThreadPopoverHandle, showCommentThreadPopover } from './commentThreadPopover';
import type { ICommentInstantAnswerMetadata } from '../../websockets/completions/CompletionModels';
import TextAndIconButton from '../../components/TextAndIconButton';
import CommentIcon from '../../icons/CommentIcon';
import {
    hasOutputActionSlot,
    mountOutputAction,
    unmountOutputAction,
} from '../OutputActions/outputActionsToolbar';

import '../../../style/Comments.css';

/** Must match `DOCUMENT_MODE_CSS_CLASS` in NotebookViewModePlugin (avoid circular import). */
const MITO_NOTEBOOK_DOCUMENT_MODE_CLASS = 'jp-mod-mito-document-mode';

// Track compartments and the EditorView they were applied to, keyed by cell ID
const commentSelectionCompartments = new Map<string, { compartment: Compartment; view: any }>();

// Track compartments for gutter indicator extensions, keyed by cell ID
const commentGutterCompartments = new Map<string, { compartment: Compartment; view: any }>();


// Track active comments so indicator clicks can find the matching comment
let activeComments: Array<{ type: string; value: string }> = [];

// Instant answer plumbing, initialized on plugin activation. Module-level so
// the exported output button mounter can reach it without a signature change.
let instantAnswerService: CommentInstantAnswerService | null = null;
let pluginContextManager: IContextManager | null = null;

// Open thread popovers by thread id, so streaming callbacks can update a
// card even if the user closed and reopened it mid-stream.
const activeThreadPopovers = new Map<string, ICommentThreadPopoverHandle>();

const LIGHTNING_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h7l-1 8 11-13h-8l1-7z" fill="currentColor"/></svg>`;

function isNotebookInDocumentMode(notebookPanel: NotebookPanel): boolean {
    return notebookPanel.content.node.classList.contains(MITO_NOTEBOOK_DOCUMENT_MODE_CLASS);
}

function refreshCommentIndicators(app: JupyterFrontEnd, notebookTracker: INotebookTracker): void {
    updateCommentIndicators(activeComments, notebookTracker, app);
}

function buildCommentValueJSON(thread: IDocumentCommentThread): string {
    // Matches the chat additionalContext comment payloads so the backend
    // prompt formatting is shared between chat comments and instant answers.
    if (thread.type === 'code') {
        return JSON.stringify({
            cellId: thread.cellId,
            cellNumber: thread.cellNumber,
            startLine: thread.startLine,
            endLine: thread.endLine,
            selectedCode: thread.selectedCode,
            comment: thread.comment,
        });
    }
    return JSON.stringify({
        cellId: thread.cellId,
        cellNumber: thread.cellNumber,
        comment: thread.comment,
    });
}

function addThreadToChat(app: JupyterFrontEnd, thread: IDocumentCommentThread): void {
    const truncatedDisplay = thread.comment.length > 30
        ? thread.comment.substring(0, 30) + '...'
        : thread.comment;
    void app.commands.execute(COMMAND_MITO_AI_ADD_DOCUMENT_COMMENT_THREAD, {
        value: JSON.stringify(thread),
        display: truncatedDisplay,
    });
}

/**
 * Open the Google Docs-style thread card for a persisted comment thread.
 */
function openThreadCard(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    cellModel: ICellModel,
    thread: IDocumentCommentThread,
    rect: DOMRect,
): void {
    const handle = showCommentThreadPopover({
        rect,
        thread,
        onAddToChat: () => addThreadToChat(app, thread),
        onResolve: () => {
            removeDocumentCommentThread(cellModel, thread.id);
            activeThreadPopovers.delete(thread.id);
            refreshCommentIndicators(app, notebookTracker);
        },
    });
    activeThreadPopovers.set(thread.id, handle);
}

/**
 * Request the streamed AI answer for a thread and persist the result back to
 * the cell metadata. The thread card (if open) is updated live.
 */
async function requestInstantAnswerForThread(
    notebookPanel: NotebookPanel,
    cellModel: ICellModel,
    thread: IDocumentCommentThread,
): Promise<void> {
    if (!instantAnswerService) {
        return;
    }

    let base64EncodedCellOutput: string | undefined;
    if (thread.type === 'output') {
        base64EncodedCellOutput = await getCellOutputByIDInNotebook(notebookPanel, thread.cellId);
    }

    const context = pluginContextManager?.getNotebookContext(notebookPanel.id);
    const metadata: ICommentInstantAnswerMetadata = {
        promptType: 'comment_instant_answer',
        commentType: thread.type === 'code' ? 'code_comment' : 'output_comment',
        commentValue: buildCommentValueJSON(thread),
        variables: context?.variables,
        files: context?.files,
        aiOptimizedCells: getAIOptimizedCellsInNotebookPanel(notebookPanel),
        base64EncodedCellOutput,
    };

    await instantAnswerService.requestInstantAnswer(metadata, {
        onChunk: (accumulated: string) => {
            activeThreadPopovers.get(thread.id)?.updateResponse(accumulated, 'streaming');
        },
        onDone: (full: string) => {
            updateDocumentCommentThread(cellModel, thread.id, { response: full, responseStatus: 'done' });
            activeThreadPopovers.get(thread.id)?.updateResponse(full, 'done');
        },
        onError: (message: string) => {
            updateDocumentCommentThread(cellModel, thread.id, { responseStatus: 'error', responseError: message });
            activeThreadPopovers.get(thread.id)?.updateResponse('', 'error', message);
        },
    });
}

/**
 * Persist a new thread, open its card, and kick off the instant answer.
 */
function startInstantAnswerThread(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    notebookPanel: NotebookPanel,
    cellModel: ICellModel,
    thread: IDocumentCommentThread,
    rect: DOMRect,
): void {
    addDocumentCommentThread(cellModel, thread);
    refreshCommentIndicators(app, notebookTracker);
    openThreadCard(app, notebookTracker, cellModel, thread, rect);
    void requestInstantAnswerForThread(notebookPanel, cellModel, thread);
}

/**
 * Shows a DOM-based popover to get the user's comment.
 */
function showCommentPopover(
    rect: DOMRect,
    onSubmit: (comment: string) => void,
    initialValue?: string,
    onDelete?: () => void,
    submitVariant: 'addToChat' | 'instant' = 'addToChat',
): void {
    const isEditing = !!initialValue;

    const backdrop = document.createElement('div');
    backdrop.className = 'comment-popover-backdrop';

    const popover = document.createElement('div');
    popover.className = 'comment-popover';

    // Position the popover, keeping it within the viewport on all sides
    const popoverWidth = 320;
    const popoverHeight = 160;
    const gap = 4;
    const margin = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (rect.bottom + gap + popoverHeight > vh - margin) {
        popover.style.bottom = `${vh - rect.top + gap}px`;
    } else {
        popover.style.top = `${rect.bottom + gap}px`;
    }

    const rightEdge = vw - rect.right;
    if (rect.right - popoverWidth < margin) {
        popover.style.left = `${Math.max(margin, rect.left)}px`;
    } else if (rect.right > vw - margin) {
        popover.style.right = `${margin}px`;
    } else {
        popover.style.right = `${rightEdge}px`;
    }

    // Close button (X) in top right
    const closeBtn = document.createElement('button');
    closeBtn.className = 'comment-popover-close';
    closeBtn.textContent = '×';

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Add a comment for the AI...';
    if (initialValue) {
        textarea.value = initialValue;
    }

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'comment-popover-buttons';

    if (isEditing && onDelete) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'comment-popover-delete';
        deleteBtn.textContent = 'Delete';
        buttonsDiv.appendChild(deleteBtn);
        deleteBtn.addEventListener('click', () => {
            onDelete();
            cleanup();
        });
    }

    const submitBtn = document.createElement('button');
    submitBtn.className = 'comment-popover-submit';
    if (isEditing) {
        submitBtn.textContent = 'Update';
    } else if (submitVariant === 'instant') {
        submitBtn.innerHTML = `${LIGHTNING_SVG}<span>Instant response</span>`;
        submitBtn.classList.add('comment-popover-submit-instant');
    } else {
        submitBtn.textContent = 'Add to AI Chat';
    }
    buttonsDiv.appendChild(submitBtn);

    popover.appendChild(closeBtn);
    popover.appendChild(textarea);
    popover.appendChild(buttonsDiv);

    const cleanup = (): void => {
        backdrop.remove();
        popover.remove();
    };

    const submit = (): void => {
        const comment = textarea.value.trim();
        if (comment) {
            onSubmit(comment);
        }
        cleanup();
    };

    backdrop.addEventListener('click', cleanup);
    closeBtn.addEventListener('click', cleanup);
    submitBtn.addEventListener('click', submit);
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cleanup();
        }
    });
    popover.addEventListener('click', (e) => e.stopPropagation());

    document.body.appendChild(backdrop);
    document.body.appendChild(popover);

    requestAnimationFrame(() => textarea.focus());
}

function showVerifiedSnippetPopover(
    rect: DOMRect,
    reports: VerifiedReportListItem[],
    onSubmit: (reportName: string, comment: string, isNewReport: boolean, newDescription?: string) => void,
): void {
    const backdrop = document.createElement('div');
    backdrop.className = 'comment-popover-backdrop';

    const popover = document.createElement('div');
    popover.className = 'comment-popover verified-snippet-popover';

    const popoverWidth = 360;
    const popoverHeight = 280;
    const gap = 4;
    const margin = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (rect.bottom + gap + popoverHeight > vh - margin) {
        popover.style.bottom = `${vh - rect.top + gap}px`;
    } else {
        popover.style.top = `${rect.bottom + gap}px`;
    }

    const rightEdge = vw - rect.right;
    if (rect.right - popoverWidth < margin) {
        popover.style.left = `${Math.max(margin, rect.left)}px`;
    } else if (rect.right > vw - margin) {
        popover.style.right = `${margin}px`;
    } else {
        popover.style.right = `${rightEdge}px`;
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'comment-popover-close';
    closeBtn.textContent = '×';

    const reportLabel = document.createElement('label');
    reportLabel.textContent = 'Verified Report';
    reportLabel.className = 'verified-snippet-popover-label';

    const reportSelect = document.createElement('select');
    reportSelect.className = 'verified-snippet-popover-select';

    // List existing reports first so the most common case (adding to an
    // existing report) is the default selection.
    reports.forEach(report => {
        const option = document.createElement('option');
        option.value = report.name;
        option.textContent = report.name;
        reportSelect.appendChild(option);
    });

    const newOption = document.createElement('option');
    newOption.value = '__new__';
    newOption.textContent = '+ Create new report...';
    reportSelect.appendChild(newOption);

    const newReportFields = document.createElement('div');
    newReportFields.className = 'verified-snippet-new-report-fields';

    const nameInput = document.createElement('input');
    nameInput.placeholder = 'Report name';
    nameInput.className = 'verified-snippet-popover-input';

    const descriptionInput = document.createElement('textarea');
    descriptionInput.placeholder = 'What can the agent learn from this report?';
    descriptionInput.className = 'verified-snippet-popover-textarea';
    descriptionInput.rows = 2;

    newReportFields.appendChild(nameInput);
    newReportFields.appendChild(descriptionInput);

    const commentLabel = document.createElement('label');
    commentLabel.textContent = 'Best practice comment';
    commentLabel.className = 'verified-snippet-popover-label';

    const commentTextarea = document.createElement('textarea');
    commentTextarea.placeholder = 'Explain the best practice in this code...';
    commentTextarea.className = 'verified-snippet-popover-textarea';

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'comment-popover-buttons';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'comment-popover-submit';
    submitBtn.textContent = 'Save Verified Snippet';
    buttonsDiv.appendChild(submitBtn);

    popover.appendChild(closeBtn);
    popover.appendChild(reportLabel);
    popover.appendChild(reportSelect);
    popover.appendChild(newReportFields);
    popover.appendChild(commentLabel);
    popover.appendChild(commentTextarea);
    popover.appendChild(buttonsDiv);

    const cleanup = (): void => {
        backdrop.remove();
        popover.remove();
    };

    const syncNewReportFieldsVisibility = (): void => {
        newReportFields.style.display = reportSelect.value === '__new__' ? 'flex' : 'none';
    };
    syncNewReportFieldsVisibility();
    reportSelect.addEventListener('change', syncNewReportFieldsVisibility);

    const submit = (): void => {
        const comment = commentTextarea.value.trim();
        if (!comment) {
            return;
        }

        const isNewReport = reportSelect.value === '__new__';
        if (isNewReport) {
            const reportName = slugifyRuleName(nameInput.value);
            if (!reportName) {
                Notification.error('Report name is required.', { autoClose: 3000 });
                return;
            }
            onSubmit(reportName, comment, true, descriptionInput.value.trim());
        } else {
            onSubmit(reportSelect.value, comment, false);
        }
        cleanup();
    };

    backdrop.addEventListener('click', cleanup);
    closeBtn.addEventListener('click', cleanup);
    submitBtn.addEventListener('click', submit);
    commentTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cleanup();
        }
    });
    popover.addEventListener('click', (e) => e.stopPropagation());

    document.body.appendChild(backdrop);
    document.body.appendChild(popover);

    requestAnimationFrame(() => commentTextarea.focus());
}

/**
 * Apply the comment selection tooltip extension to a single code cell.
 */
function applySelectionExtensionToCell(cell: CodeCell): void {
    const cellId = cell.model.id;
    const cmEditor = cell.editor as any;
    const editorView = cmEditor?.editor;
    if (!editorView) {
        return;
    }

    const existing = commentSelectionCompartments.get(cellId);
    // Skip if already applied to this exact EditorView instance
    if (existing && existing.view === editorView) {
        return;
    }

    const compartment = new Compartment();
    commentSelectionCompartments.set(cellId, { compartment, view: editorView });
    editorView.dispatch({
        effects: StateEffect.appendConfig.of(
            compartment.of(commentSelectionExtension())
        ),
    });
}

/**
 * Apply selection extension to all code cells in a notebook panel.
 */
function applySelectionExtensionToAllCells(notebookPanel: NotebookPanel): void {
    const notebook = notebookPanel.content;
    if (!notebook) {
        return;
    }
    for (const cell of notebook.widgets) {
        if (cell instanceof CodeCell) {
            applySelectionExtensionToCell(cell);
        }
    }
}


// ---- Output Comment Button (React component) ----

interface OutputCommentButtonProps {
    onClick: () => void;
}

const OutputCommentButton: React.FC<OutputCommentButtonProps> = ({ onClick }) => {
    return (
        <TextAndIconButton
            icon={CommentIcon}
            text="Comment"
            title="Comment on output for AI"
            onClick={onClick}
            variant="purple"
            width="fit-contents"
            iconPosition="left"
        />
    );
};

export function shouldMountOutputCommentButton(
    isDocumentMode: boolean,
    isMitosheetOutput: boolean,
): boolean {
    if (isMitosheetOutput && !isDocumentMode) {
        return false;
    }
    return true;
}

export function mountOutputCommentButtonOnHost(
    host: HTMLElement,
    cellId: string,
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
): Root | null {
    if (hasOutputActionSlot(host, 'comment')) {
        return null;
    }

    const handleClick = (): void => {
        const notebookPanel = notebookTracker.currentWidget;
        if (!notebookPanel) {
            return;
        }

        const cellNumber = getCellNumberById(cellId, notebookPanel) || 0;
        const commentSlot = host.querySelector('.mito-output-action-slot-comment') as HTMLElement | null;
        const btnRect = (commentSlot ?? host).getBoundingClientRect();
        const documentMode = isNotebookInDocumentMode(notebookPanel);

        showCommentPopover(
            btnRect,
            (comment: string) => {
                if (documentMode) {
                    const cell = notebookPanel.content.widgets.find(w => w.model.id === cellId);
                    if (!cell) {
                        return;
                    }
                    const thread: IDocumentCommentThread = {
                        id: UUID.uuid4(),
                        type: 'output',
                        cellId,
                        cellNumber,
                        comment,
                        response: '',
                        responseStatus: 'loading',
                    };
                    startInstantAnswerThread(app, notebookTracker, notebookPanel, cell.model, thread, btnRect);
                    return;
                }

                const truncatedDisplay = comment.length > 30
                    ? comment.substring(0, 30) + '...'
                    : comment;

                const value = JSON.stringify({
                    cellId,
                    cellNumber,
                    comment,
                });

                void app.commands.execute(COMMAND_MITO_AI_ADD_OUTPUT_COMMENT, {
                    value,
                    display: truncatedDisplay,
                });
            },
            undefined,
            undefined,
            documentMode ? 'instant' : 'addToChat'
        );
    };

    return mountOutputAction(host, 'comment', <OutputCommentButton onClick={handleClick} />);
}

/**
 * Inject a "Comment" button into a code cell's output wrapper.
 * Mitosheet / default dataframe outputs skip the button in Notebook mode only;
 * in Document mode they get the same comment affordance as other outputs.
 */
function injectOutputCommentButton(
    cell: CodeCell,
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    notebookPanel: NotebookPanel,
): void {
    const outputWrapper = cell.node.querySelector('.jp-Cell-outputWrapper') as HTMLElement | null;
    if (!outputWrapper) {
        return;
    }

    const isDocumentMode = notebookPanel.content.node.classList.contains(
        MITO_NOTEBOOK_DOCUMENT_MODE_CLASS
    );

    const isMitosheetOutput =
        !!outputWrapper.querySelector('.mito-container, .mito-viewer, .mito-mime-renderer') ||
        cell.model.sharedModel.getSource().toLowerCase().includes('mitosheet');

    if (!shouldMountOutputCommentButton(isDocumentMode, isMitosheetOutput)) {
        unmountOutputAction(outputWrapper, 'comment');
        return;
    }

    mountOutputCommentButtonOnHost(outputWrapper, cell.model.id, app, notebookTracker);
}

/**
 * Inject comment buttons into all code cells that have output,
 * and observe for new outputs being rendered.
 */
function setupOutputCommentButtons(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
): void {
    const OUTPUT_MUTATION_SELECTOR =
        '.jp-Cell-outputWrapper, .jp-Cell-outputArea, .jp-OutputArea-output';

    const isRelevantOutputMutationNode = (node: Node): boolean => {
        if (!(node instanceof HTMLElement)) {
            return false;
        }

        // Ignore mutations produced by our own injection.
        if (
            node.classList.contains('mito-output-actions-toolbar') ||
            node.closest('.mito-output-actions-toolbar')
        ) {
            return false;
        }

        return node.matches(OUTPUT_MUTATION_SELECTOR) || !!node.querySelector(OUTPUT_MUTATION_SELECTOR);
    };

    const hasRelevantOutputMutation = (mutations: MutationRecord[]): boolean => {
        return mutations.some((mutation) =>
            Array.from(mutation.addedNodes).some(isRelevantOutputMutationNode)
        );
    };

    const injectAllForPanel = (notebookPanel: NotebookPanel): void => {
        for (const cell of notebookPanel.content.widgets) {
            if (cell instanceof CodeCell && cell.outputArea?.model.length > 0) {
                injectOutputCommentButton(cell, app, notebookTracker, notebookPanel);
            }
        }
    };

    const setupPanelObserver = (notebookPanel: NotebookPanel): void => {
        notebookPanel.revealed.then(() => {
            injectAllForPanel(notebookPanel);
            let isInjectScheduled = false;

            const scheduleInjectAll = (): void => {
                if (isInjectScheduled) {
                    return;
                }
                isInjectScheduled = true;
                requestAnimationFrame(() => {
                    isInjectScheduled = false;
                    injectAllForPanel(notebookPanel);
                });
            };

            // Scope observer to the notebook node, not document.body
            const observer = new MutationObserver((mutations) => {
                if (!hasRelevantOutputMutation(mutations)) {
                    return;
                }
                scheduleInjectAll();
            });
            observer.observe(notebookPanel.content.node, { childList: true, subtree: true });

            // Document mode toggles a class on the notebook root only; re-inject so Mitosheet
            // outputs pick up the Comment button when entering Document mode.
            const documentClassObserver = new MutationObserver(() => {
                scheduleInjectAll();
            });
            documentClassObserver.observe(notebookPanel.content.node, {
                attributes: true,
                attributeFilter: ['class']
            });

            // Disconnect when the notebook is disposed
            notebookPanel.disposed.connect(() => {
                observer.disconnect();
                documentClassObserver.disconnect();
            });
        }).catch(() => {});
    };

    notebookTracker.forEach(widget => setupPanelObserver(widget));
    notebookTracker.widgetAdded.connect((_sender, widget) => {
        setupPanelObserver(widget);
    });
}

/**
 * Apply or remove gutter indicators for code comments, and
 * add/remove purple left border for output comments.
 */
function updateCommentIndicators(
    comments: Array<{ type: string; value: string }>,
    notebookTracker: INotebookTracker,
    app: JupyterFrontEnd,
): void {
    const notebookPanel = notebookTracker.currentWidget;
    if (!notebookPanel) {
        return;
    }

    activeComments = comments;

    const sortRangesByStartLine = (ranges: CommentLineRange[]): CommentLineRange[] => {
        return [...ranges].sort((a, b) => {
            if (a.startLine !== b.startLine) {
                return a.startLine - b.startLine;
            }
            return a.endLine - b.endLine;
        });
    };

    // Group code comments by cellId
    const codeCommentsByCell = new Map<string, CommentLineRange[]>();
    for (const comment of comments) {
        if (comment.type === 'code_comment') {
            try {
                const info = JSON.parse(comment.value);
                const ranges = codeCommentsByCell.get(info.cellId) || [];
                ranges.push({ startLine: info.startLine, endLine: info.endLine });
                codeCommentsByCell.set(info.cellId, sortRangesByStartLine(ranges));
            } catch {
                continue;
            }
        }
    }

    // Collect output comment cell IDs
    const outputCommentCellIds = new Set<string>();
    for (const comment of comments) {
        if (comment.type === 'output_comment') {
            try {
                const info = JSON.parse(comment.value);
                outputCommentCellIds.add(info.cellId);
            } catch {
                continue;
            }
        }
    }

    // Merge persisted document comment threads from cell metadata so their
    // indicators render alongside chat-context comments
    const outputThreadsByCell = new Map<string, IDocumentCommentThread>();
    for (const cell of notebookPanel.content.widgets) {
        for (const thread of getDocumentCommentThreads(cell.model)) {
            if (thread.type === 'code' && thread.startLine !== undefined && thread.endLine !== undefined) {
                const ranges = codeCommentsByCell.get(cell.model.id) || [];
                ranges.push({ startLine: thread.startLine, endLine: thread.endLine });
                codeCommentsByCell.set(cell.model.id, sortRangesByStartLine(ranges));
            } else if (thread.type === 'output') {
                outputCommentCellIds.add(cell.model.id);
                if (!outputThreadsByCell.has(cell.model.id)) {
                    outputThreadsByCell.set(cell.model.id, thread);
                }
            }
        }
    }

    // Apply/remove gutter indicators for each cell
    for (const cell of notebookPanel.content.widgets) {
        const cellId = cell.model.id;

        if (cell instanceof CodeCell) {
            const cmEditor = cell.editor as any;
            const editorView = cmEditor?.editor;

            // Handle code comment gutter indicators
            const ranges = codeCommentsByCell.get(cellId);
            const existing = commentGutterCompartments.get(cellId);

            if (ranges && editorView) {
                // Apply or reconfigure the gutter
                if (existing && existing.view === editorView) {
                    editorView.dispatch({
                        effects: existing.compartment.reconfigure(commentGutterIndicator(ranges)),
                    });
                } else {
                    const compartment = new Compartment();
                    commentGutterCompartments.set(cellId, { compartment, view: editorView });
                    editorView.dispatch({
                        effects: StateEffect.appendConfig.of(
                            compartment.of(commentGutterIndicator(ranges))
                        ),
                    });
                }
            } else if (existing && editorView && existing.view === editorView) {
                // Remove gutter for this cell
                editorView.dispatch({
                    effects: existing.compartment.reconfigure([]),
                });
            }
        }

        // Handle output comment left border + click to edit (code outputs or rendered markdown)
        const outputCommentHost =
            cell instanceof CodeCell
                ? (cell.node.querySelector('.jp-Cell-outputWrapper') as HTMLElement | null)
                : cell instanceof MarkdownCell
                  ? (cell.node.querySelector('.jp-MarkdownOutput') as HTMLElement | null)
                  : null;

        if (outputCommentHost) {
            // Remove any previous click handler
            const prevHandler = (outputCommentHost as any).__commentIndicatorClick;
            if (prevHandler) {
                outputCommentHost.removeEventListener('click', prevHandler);
                delete (outputCommentHost as any).__commentIndicatorClick;
            }

            if (outputCommentCellIds.has(cellId)) {
                outputCommentHost.classList.add('comment-indicator-active');

                const metadataThread = outputThreadsByCell.get(cellId);

                // Add click handler to open the thread card / edit the comment
                const matchingComment = comments.find(c => {
                    if (c.type !== 'output_comment') { return false; }
                    try { return JSON.parse(c.value).cellId === cellId; } catch { return false; }
                });
                if (metadataThread || matchingComment) {
                    const handler = (e: Event): void => {
                        // Only handle clicks on the border area (left 3px)
                        const mouseEvent = e as MouseEvent;
                        const wrapperRect = outputCommentHost.getBoundingClientRect();
                        if (mouseEvent.clientX > wrapperRect.left + 10) {
                            return;
                        }
                        const rect = new DOMRect(wrapperRect.left, mouseEvent.clientY - 10, 0, 20);

                        // Persisted instant-answer threads open the thread card
                        if (metadataThread) {
                            openThreadCard(app, notebookTracker, cell.model, metadataThread, rect);
                            return;
                        }
                        if (!matchingComment) {
                            return;
                        }

                        const info = JSON.parse(matchingComment.value);
                        const cellNumber = info.cellNumber;
                        showCommentPopover(rect, (comment: string) => {
                            const truncatedDisplay = comment.length > 30
                                ? comment.substring(0, 30) + '...'
                                : comment;
                            const value = JSON.stringify({ cellId, cellNumber, comment });
                            void app.commands.execute(COMMAND_MITO_AI_ADD_OUTPUT_COMMENT, {
                                value,
                                display: truncatedDisplay,
                            });
                        }, info.comment, () => {
                            void app.commands.execute(COMMAND_MITO_AI_REMOVE_OUTPUT_COMMENT, {
                                cellId,
                            });
                        });
                    };
                    outputCommentHost.addEventListener('click', handler);
                    (outputCommentHost as any).__commentIndicatorClick = handler;
                }
            } else {
                outputCommentHost.classList.remove('comment-indicator-active');
            }
        }
    }
}

// ---- Plugin ----

const CommentsPlugin: JupyterFrontEndPlugin<void> = {
    id: 'mito_ai:comments',
    description: 'Adds comment tooltip on code selection and comment button on output hover',
    autoStart: true,
    requires: [INotebookTracker, IContextManager],
    activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker, contextManager: IContextManager) => {
        const { commands } = app;

        // Initialize instant answer plumbing (module-level so the exported
        // output button mounter can reach it)
        instantAnswerService = new CommentInstantAnswerService(app.serviceManager.serverSettings);
        pluginContextManager = contextManager;

        // ---- Code Comments: Listen for selection tooltip clicks ----
        document.addEventListener(COMMENT_TOOLTIP_CLICK_EVENT, ((e: CustomEvent<CommentTooltipClickDetail>) => {
            const { rect } = e.detail;

            const notebookPanel = notebookTracker.currentWidget;
            if (!notebookPanel) {
                return;
            }

            const activeCell = notebookPanel.content.activeCell;
            if (!activeCell || !(activeCell instanceof CodeCell)) {
                return;
            }

            const cellId = activeCell.model.id;
            const cellNumber = getCellNumberById(cellId, notebookPanel) || 0;
            const cmEditor = activeCell.editor as any;
            const editorView = cmEditor?.editor;

            if (!editorView) {
                return;
            }

            // Capture selection state now, before showing the popover.
            // Once the user clicks into the popover textarea, the CM selection is lost.
            const state = editorView.state;
            const selection = state.selection.main;
            const startLine = state.doc.lineAt(selection.from).number - 1; // 0-indexed
            const endLine = state.doc.lineAt(selection.to).number - 1;
            const selectedCode = state.sliceDoc(selection.from, selection.to);

            dismissCommentTooltip(editorView);

            const documentMode = isNotebookInDocumentMode(notebookPanel);

            // This callback runs when the user submits the popover
            showCommentPopover(rect, (comment: string) => {
                if (documentMode) {
                    const thread: IDocumentCommentThread = {
                        id: UUID.uuid4(),
                        type: 'code',
                        cellId,
                        cellNumber,
                        startLine,
                        endLine,
                        selectedCode,
                        comment,
                        response: '',
                        responseStatus: 'loading',
                    };
                    startInstantAnswerThread(app, notebookTracker, notebookPanel, activeCell.model, thread, rect);
                    return;
                }

                const truncatedDisplay = comment.length > 30
                    ? comment.substring(0, 30) + '...'
                    : comment;

                const value = JSON.stringify({
                    cellId,
                    cellNumber,
                    startLine,
                    endLine,
                    selectedCode,
                    comment,
                });

                void commands.execute(COMMAND_MITO_AI_ADD_CODE_COMMENT, {
                    value,
                    display: truncatedDisplay,
                });
            }, undefined, undefined, documentMode ? 'instant' : 'addToChat');
        }) as EventListener);

        document.addEventListener(VERIFIED_SNIPPET_TOOLTIP_CLICK_EVENT, ((e: CustomEvent<CommentTooltipClickDetail>) => {
            const { rect } = e.detail;

            const notebookPanel = notebookTracker.currentWidget;
            if (!notebookPanel) {
                return;
            }

            const activeCell = notebookPanel.content.activeCell;
            if (!activeCell || !(activeCell instanceof CodeCell)) {
                return;
            }

            const cmEditor = activeCell.editor as any;
            const editorView = cmEditor?.editor;

            if (!editorView) {
                return;
            }

            const state = editorView.state;
            const selection = state.selection.main;
            const selectedCode = state.sliceDoc(selection.from, selection.to);
            const cellCode = state.doc.toString();

            dismissCommentTooltip(editorView);

            void getVerifiedReports().then(reports => {
                showVerifiedSnippetPopover(rect, reports, (reportName, comment, isNewReport, newDescription) => {
                    // The save makes an LLM call to generate snippet context, which
                    // can take a few seconds, so show progress and let the user keep working.
                    const savePromise = addVerifiedSnippet(
                        reportName,
                        selectedCode,
                        comment,
                        cellCode,
                        isNewReport ? newDescription : undefined,
                    );

                    void Notification.promise(savePromise.then(snippet => snippet.id), {
                        pending: { message: 'Saving verified snippet...' },
                        success: {
                            message: () => `Verified snippet saved to "${reportName}".`,
                            options: {
                                autoClose: 6000,
                                actions: [
                                    {
                                        label: 'View Report',
                                        callback: () => {
                                            void savePromise.then(snippet => {
                                                void commands.execute(COMMAND_MITO_AI_OPEN_SETTINGS_VERIFIED_REPORTS, {
                                                    reportName,
                                                    snippetId: snippet.id,
                                                });
                                            });
                                        },
                                    },
                                ],
                            },
                        },
                        error: {
                            message: (reason: unknown) =>
                                reason instanceof Error ? reason.message : 'Failed to save verified snippet.',
                            options: { autoClose: 5000 },
                        },
                    });
                });
            }).catch(err => {
                Notification.error(
                    err instanceof Error ? err.message : 'Failed to load verified reports.',
                    { autoClose: 5000 },
                );
            });
        }) as EventListener);

        // ---- Code Comments: Apply selection extension to cells ----
        const setupNotebook = (notebookPanel: NotebookPanel): void => {
            notebookPanel.revealed.then(() => {
                applySelectionExtensionToAllCells(notebookPanel);

                // Load persisted comment threads: mark threads whose responses
                // were interrupted by a reload, then render their indicators.
                for (const cell of notebookPanel.content.widgets) {
                    normalizeInterruptedThreads(cell.model);
                }
                refreshCommentIndicators(app, notebookTracker);

                const notebook = notebookPanel.content;
                notebook.model?.cells.changed.connect(() => {
                    setTimeout(() => applySelectionExtensionToAllCells(notebookPanel), 100);
                });

                // When the active cell changes, try to apply the extension.
                // This catches cells whose editors weren't ready on initial setup.
                notebook.activeCellChanged.connect(() => {
                    const activeCell = notebook.activeCell;
                    if (activeCell instanceof CodeCell) {
                        applySelectionExtensionToCell(activeCell);
                    }
                });
            }).catch(() => {
                // Ignore errors during setup
            });
        };

        notebookTracker.forEach(widget => setupNotebook(widget));
        notebookTracker.widgetAdded.connect((_sender, widget) => {
            setupNotebook(widget);
        });

        // ---- Output Comments: Inject comment button into all output cells ----
        setupOutputCommentButtons(app, notebookTracker);

        // ---- Comment Indicators: Register update command ----
        commands.addCommand(COMMAND_MITO_AI_UPDATE_COMMENT_INDICATORS, {
            label: 'Update comment indicators in notebook',
            execute: (args?: any) => {
                const comments = (args?.comments as Array<{ type: string; value: string }>) || [];
                updateCommentIndicators(comments, notebookTracker, app);
            },
        });

        // ---- Comment Indicators: Handle gutter indicator clicks ----
        document.addEventListener(COMMENT_INDICATOR_CLICK_EVENT, ((e: CustomEvent<CommentIndicatorClickDetail>) => {
            const { lineNumber } = e.detail;

            const notebookPanel = notebookTracker.currentWidget;
            if (!notebookPanel) {
                return;
            }

            const activeCell = notebookPanel.content.activeCell;
            if (!activeCell || !(activeCell instanceof CodeCell)) {
                return;
            }

            const cellId = activeCell.model.id;

            // Get the rect of the gutter element at the clicked line for popover positioning
            const cmEditor = activeCell.editor as any;
            const editorView = cmEditor?.editor;
            if (!editorView) {
                return;
            }

            const lineInfo = editorView.state.doc.line(lineNumber + 1);
            const coords = editorView.coordsAtPos(lineInfo.from);
            const rect = new DOMRect(coords?.left || 0, coords?.top || 0, 0, coords ? coords.bottom - coords.top : 20);

            // Persisted instant-answer threads open the thread card
            const metadataThread = getDocumentCommentThreads(activeCell.model).find(thread =>
                thread.type === 'code'
                && thread.startLine !== undefined
                && thread.endLine !== undefined
                && lineNumber >= thread.startLine
                && lineNumber <= thread.endLine
            );
            if (metadataThread) {
                openThreadCard(app, notebookTracker, activeCell.model, metadataThread, rect);
                return;
            }

            // Find the matching comment for this cell and line
            const matchingComment = activeComments.find(c => {
                if (c.type !== 'code_comment') {
                    return false;
                }
                try {
                    const info = JSON.parse(c.value);
                    return info.cellId === cellId && lineNumber >= info.startLine && lineNumber <= info.endLine;
                } catch {
                    return false;
                }
            });

            if (!matchingComment) {
                return;
            }

            const info = JSON.parse(matchingComment.value);
            const cellNumber = getCellNumberById(cellId, notebookPanel) || 0;

            showCommentPopover(rect, (comment: string) => {
                const truncatedDisplay = comment.length > 30
                    ? comment.substring(0, 30) + '...'
                    : comment;

                const value = JSON.stringify({
                    cellId,
                    cellNumber,
                    startLine: info.startLine,
                    endLine: info.endLine,
                    selectedCode: info.selectedCode,
                    comment,
                });

                void commands.execute(COMMAND_MITO_AI_ADD_CODE_COMMENT, {
                    value,
                    display: truncatedDisplay,
                });
            }, info.comment, () => {
                void commands.execute(COMMAND_MITO_AI_REMOVE_CODE_COMMENT, {
                    cellId,
                    startLine: info.startLine,
                    endLine: info.endLine,
                });
            });
        }) as EventListener);

        console.log('mito-ai: CommentsPlugin activated');
    }
};

export default CommentsPlugin;

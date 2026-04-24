/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { CodeCell } from '@jupyterlab/cells';
import { Compartment, StateEffect } from '@codemirror/state';
import { commentSelectionExtension, COMMENT_TOOLTIP_CLICK_EVENT, CommentTooltipClickDetail, dismissCommentTooltip } from './AddCommentBubble';
import { commentGutterIndicator, CommentLineRange, COMMENT_INDICATOR_CLICK_EVENT, CommentIndicatorClickDetail } from './CommentGutterIndicator';
import {
    COMMAND_MITO_AI_ADD_CODE_COMMENT,
    COMMAND_MITO_AI_ADD_OUTPUT_COMMENT,
    COMMAND_MITO_AI_UPDATE_COMMENT_INDICATORS,
    COMMAND_MITO_AI_REMOVE_CODE_COMMENT,
    COMMAND_MITO_AI_REMOVE_OUTPUT_COMMENT,
} from '../../commands';
import { getCellNumberById } from '../../utils/cellReferences';
import TextAndIconButton from '../../components/TextAndIconButton';
import CommentIcon from '../../icons/CommentIcon';

import '../../../style/Comments.css';

// Track compartments and the EditorView they were applied to, keyed by cell ID
const commentSelectionCompartments = new Map<string, { compartment: Compartment; view: any }>();

// Track compartments for gutter indicator extensions, keyed by cell ID
const commentGutterCompartments = new Map<string, { compartment: Compartment; view: any }>();


// Track active comments so indicator clicks can find the matching comment
let activeComments: Array<{ type: string; value: string }> = [];

/**
 * Shows a DOM-based popover to get the user's comment.
 */
function showCommentPopover(
    rect: DOMRect,
    onSubmit: (comment: string) => void,
    initialValue?: string,
    onDelete?: () => void,
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
    submitBtn.textContent = isEditing ? 'Update' : 'Add to AI Chat';
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

/**
 * Inject a "Comment" button into a code cell's output wrapper.
 * Works for all output types (images, text, tables, HTML, etc.).
 */
function injectOutputCommentButton(
    cell: CodeCell,
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
): void {
    const outputWrapper = cell.node.querySelector('.jp-Cell-outputWrapper') as HTMLElement | null;
    if (!outputWrapper) {
        return;
    }

    // Don't add if already present
    if (outputWrapper.querySelector('.output-comment-button-container')) {
        return;
    }

    // Make the wrapper a positioning context and add hover class
    outputWrapper.style.position = 'relative';
    outputWrapper.classList.add('output-comment-output-container');

    const commentBtnDiv = document.createElement('div');
    commentBtnDiv.className = 'output-comment-button-container';

    const handleClick = (): void => {
        const notebookPanel = notebookTracker.currentWidget;
        if (!notebookPanel) {
            return;
        }

        const cellId = cell.model.id;
        const cellNumber = getCellNumberById(cellId, notebookPanel) || 0;
        const btnRect = commentBtnDiv.getBoundingClientRect();

        showCommentPopover(
            btnRect,
            (comment: string) => {
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
            }
        );
    };

    const root = createRoot(commentBtnDiv);
    root.render(<OutputCommentButton onClick={handleClick} />);

    outputWrapper.appendChild(commentBtnDiv);
}

/**
 * Inject comment buttons into all code cells that have output,
 * and observe for new outputs being rendered.
 */
function setupOutputCommentButtons(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
): void {
    const OUTPUT_MUTATION_SELECTOR = '.jp-Cell-outputWrapper, .jp-Cell-outputArea, .jp-OutputArea-output';

    const isRelevantOutputMutationNode = (node: Node): boolean => {
        if (!(node instanceof HTMLElement)) {
            return false;
        }

        // Ignore mutations produced by our own injection.
        if (node.classList.contains('output-comment-button-container') || node.closest('.output-comment-button-container')) {
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
                injectOutputCommentButton(cell, app, notebookTracker);
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

            // Disconnect when the notebook is disposed
            notebookPanel.disposed.connect(() => {
                observer.disconnect();
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

    // Apply/remove gutter indicators for each cell
    for (const cell of notebookPanel.content.widgets) {
        if (!(cell instanceof CodeCell)) {
            continue;
        }
        const cellId = cell.model.id;
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

        // Handle output comment left border + click to edit
        const outputWrapper = cell.node.querySelector('.jp-Cell-outputWrapper') as HTMLElement | null;
        if (outputWrapper) {
            // Remove any previous click handler
            const prevHandler = (outputWrapper as any).__commentIndicatorClick;
            if (prevHandler) {
                outputWrapper.removeEventListener('click', prevHandler);
                delete (outputWrapper as any).__commentIndicatorClick;
            }

            if (outputCommentCellIds.has(cellId)) {
                outputWrapper.classList.add('comment-indicator-active');

                // Add click handler to edit the comment
                const matchingComment = comments.find(c => {
                    if (c.type !== 'output_comment') { return false; }
                    try { return JSON.parse(c.value).cellId === cellId; } catch { return false; }
                });
                if (matchingComment) {
                    const handler = (e: Event): void => {
                        // Only handle clicks on the border area (left 3px)
                        const mouseEvent = e as MouseEvent;
                        const wrapperRect = outputWrapper.getBoundingClientRect();
                        if (mouseEvent.clientX > wrapperRect.left + 10) {
                            return;
                        }
                        const info = JSON.parse(matchingComment.value);
                        const cellNumber = info.cellNumber;
                        const rect = new DOMRect(wrapperRect.left, mouseEvent.clientY - 10, 0, 20);
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
                    outputWrapper.addEventListener('click', handler);
                    (outputWrapper as any).__commentIndicatorClick = handler;
                }
            } else {
                outputWrapper.classList.remove('comment-indicator-active');
            }
        }
    }
}

// ---- Plugin ----

const CommentsPlugin: JupyterFrontEndPlugin<void> = {
    id: 'mito_ai:comments',
    description: 'Adds comment tooltip on code selection and comment button on output hover',
    autoStart: true,
    requires: [INotebookTracker],
    activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
        const { commands } = app;

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

            // This callback runs when the user clicks "Add" in the popover
            showCommentPopover(rect, (comment: string) => {
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
            });
        }) as EventListener);

        // ---- Code Comments: Apply selection extension to cells ----
        const setupNotebook = (notebookPanel: NotebookPanel): void => {
            notebookPanel.revealed.then(() => {
                applySelectionExtensionToAllCells(notebookPanel);

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

            // Get the rect of the gutter element at the clicked line for popover positioning
            const cmEditor = activeCell.editor as any;
            const editorView = cmEditor?.editor;
            if (!editorView) {
                return;
            }

            const lineInfo = editorView.state.doc.line(lineNumber + 1);
            const coords = editorView.coordsAtPos(lineInfo.from);
            const rect = new DOMRect(coords?.left || 0, coords?.top || 0, 0, coords ? coords.bottom - coords.top : 20);

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

/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { CodeCell } from '@jupyterlab/cells';
import { Compartment, StateEffect } from '@codemirror/state';
import { commentSelectionExtension, COMMENT_TOOLTIP_CLICK_EVENT, CommentTooltipClickDetail, dismissCommentTooltip } from './commentGutterExtension';
import { COMMAND_MITO_AI_ADD_CODE_COMMENT, COMMAND_MITO_AI_ADD_OUTPUT_COMMENT } from '../../commands';
import { getCellOutputByID } from '../../utils/cellOutput';
import TextAndIconButton from '../../components/TextAndIconButton';
import CommentIcon from '../../icons/CommentIcon';

import '../../../style/Comments.css';

// Track compartments for each cell's selection tooltip extension
const commentSelectionCompartments = new Map<string, Compartment>();

// Track roots for cleanup
const outputCommentRoots = new WeakMap<HTMLElement, Root>();

/**
 * Shows a DOM-based popover to get the user's comment.
 */
function showCommentPopover(
    rect: DOMRect,
    onSubmit: (comment: string) => void,
): void {
    const backdrop = document.createElement('div');
    backdrop.className = 'comment-popover-backdrop';

    const popover = document.createElement('div');
    popover.className = 'comment-popover';
    popover.style.top = `${rect.bottom + 4}px`;
    popover.style.left = `${rect.left}px`;

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Add a comment for the AI...';

    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'comment-popover-buttons';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';

    const submitBtn = document.createElement('button');
    submitBtn.className = 'comment-popover-submit';
    submitBtn.textContent = 'Add';

    buttonsDiv.appendChild(cancelBtn);
    buttonsDiv.appendChild(submitBtn);
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
    cancelBtn.addEventListener('click', cleanup);
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

    let compartment = commentSelectionCompartments.get(cellId);
    if (!compartment) {
        compartment = new Compartment();
        commentSelectionCompartments.set(cellId, compartment);
        editorView.dispatch({
            effects: StateEffect.appendConfig.of(
                compartment.of(commentSelectionExtension())
            ),
        });
    }
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

/**
 * Get the cell number (1-indexed) for a cell by its ID.
 */
function getCellNumber(notebookPanel: NotebookPanel, cellId: string): number {
    const cells = notebookPanel.content.widgets;
    for (let i = 0; i < cells.length; i++) {
        if (cells[i]?.model.id === cellId) {
            return i + 1;
        }
    }
    return 0;
}

/**
 * Get the text content of a cell's output area.
 */
function getOutputTextContent(cell: CodeCell): string {
    const outputNode = cell.outputArea?.node;
    if (!outputNode) {
        return '';
    }
    return outputNode.textContent?.trim() || '';
}

/**
 * Find the CodeCell that contains a given DOM node.
 */
function findCellForNode(
    node: HTMLElement,
    notebookPanel: NotebookPanel
): CodeCell | null {
    const cellElement = node.closest('.jp-Cell') as HTMLElement | null;
    if (!cellElement) {
        return null;
    }
    const cellWidget = notebookPanel.content.widgets.find(cell => {
        if (cell instanceof CodeCell) {
            return cell.node.contains(cellElement) || cellElement.contains(cell.node);
        }
        return false;
    });
    return cellWidget instanceof CodeCell ? cellWidget : null;
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
 * Inject a "Comment" button into an output area that already has the
 * chart-wizard-output-container structure (position: relative parent).
 * The button is placed to the right of the chart wizard button.
 */
function injectOutputCommentButton(
    container: HTMLElement,
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
): void {
    // Don't add if already present
    if (container.querySelector('.output-comment-button-container')) {
        return;
    }

    const commentBtnDiv = document.createElement('div');
    commentBtnDiv.className = 'output-comment-button-container';

    const handleClick = (): void => {
        const notebookPanel = notebookTracker.currentWidget;
        if (!notebookPanel) {
            return;
        }

        const cellWidget = findCellForNode(container, notebookPanel);
        if (!cellWidget) {
            return;
        }

        const cellId = cellWidget.model.id;
        const cellNumber = getCellNumber(notebookPanel, cellId);
        const btnRect = commentBtnDiv.getBoundingClientRect();

        showCommentPopover(
            { ...btnRect, bottom: btnRect.top + btnRect.height + 4, left: btnRect.left } as DOMRect,
            async (comment: string) => {
                const truncatedDisplay = comment.length > 30
                    ? comment.substring(0, 30) + '...'
                    : comment;

                let outputSnapshot: string | undefined;
                try {
                    outputSnapshot = await getCellOutputByID(notebookTracker, cellId);
                } catch {
                    // Fall back to text content
                }

                const outputTextContent = getOutputTextContent(cellWidget);

                const value = JSON.stringify({
                    cellId,
                    cellNumber,
                    comment,
                    outputSnapshot: outputSnapshot || undefined,
                    outputTextContent: outputTextContent || undefined,
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
    outputCommentRoots.set(commentBtnDiv, root);

    container.appendChild(commentBtnDiv);
}

/**
 * Inject comment buttons into all existing chart-wizard output containers,
 * and observe for new ones being added.
 */
function setupOutputCommentButtons(
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
): void {
    // Inject into existing containers
    const injectAll = (): void => {
        document.querySelectorAll('.chart-wizard-output-container').forEach((el) => {
            injectOutputCommentButton(el as HTMLElement, app, notebookTracker);
        });
    };

    // Also inject into any output area that has position:relative set
    // (for outputs that don't have chart wizard but are rendered images)
    injectAll();

    // Use a MutationObserver to catch newly rendered outputs
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const addedNode of mutation.addedNodes) {
                if (!(addedNode instanceof HTMLElement)) {
                    continue;
                }
                // Check if the added node itself is a chart wizard container
                if (addedNode.classList?.contains('chart-wizard-output-container')) {
                    injectOutputCommentButton(addedNode, app, notebookTracker);
                }
                // Check children
                addedNode.querySelectorAll?.('.chart-wizard-output-container')?.forEach((el) => {
                    injectOutputCommentButton(el as HTMLElement, app, notebookTracker);
                });
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
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
            const cellNumber = getCellNumber(notebookPanel, cellId);
            const cmEditor = activeCell.editor as any;
            const editorView = cmEditor?.editor;

            if (!editorView) {
                return;
            }

            const state = editorView.state;
            const selection = state.selection.main;

            const startLine = state.doc.lineAt(selection.from).number - 1; // 0-indexed
            const endLine = state.doc.lineAt(selection.to).number - 1;
            const selectedCode = state.sliceDoc(selection.from, selection.to);

            // Dismiss the tooltip before showing the popover
            dismissCommentTooltip(editorView);

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
            }).catch(() => {
                // Ignore errors during setup
            });
        };

        notebookTracker.forEach(widget => setupNotebook(widget));
        notebookTracker.widgetAdded.connect((_sender, widget) => {
            setupNotebook(widget);
        });

        // ---- Output Comments: Inject button into chart-wizard output containers ----
        // Wait a tick so chart wizard has time to set up its renderers
        setTimeout(() => {
            setupOutputCommentButtons(app, notebookTracker);
        }, 500);

        console.log('mito-ai: CommentsPlugin activated');
    }
};

export default CommentsPlugin;

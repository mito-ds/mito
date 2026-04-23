/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { CodeCell } from '@jupyterlab/cells';
import { Compartment, StateEffect } from '@codemirror/state';
import { commentGutterExtension, COMMENT_GUTTER_CLICK_EVENT, CommentGutterClickDetail } from './commentGutterExtension';
import { COMMAND_MITO_AI_ADD_CODE_COMMENT, COMMAND_MITO_AI_ADD_OUTPUT_COMMENT } from '../../commands';
import { getCellOutputByID } from '../../utils/cellOutput';
import { commentLabIcon } from '../../icons';

import '../../../style/Comments.css';

// Track compartments for each cell so we can reconfigure the gutter extension
const commentGutterCompartments = new Map<string, Compartment>();

/**
 * Shows a DOM-based popover to get the user's comment.
 * Uses vanilla DOM since this plugin runs outside React.
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
 * Apply the comment gutter extension to a single code cell using the Compartment pattern.
 */
function applyGutterToCell(cell: CodeCell): void {
    const cellId = cell.model.id;
    const cmEditor = cell.editor as any;
    const editorView = cmEditor?.editor;
    if (!editorView) {
        return;
    }

    let compartment = commentGutterCompartments.get(cellId);
    if (!compartment) {
        compartment = new Compartment();
        commentGutterCompartments.set(cellId, compartment);
        editorView.dispatch({
            effects: StateEffect.appendConfig.of(
                compartment.of(commentGutterExtension())
            ),
        });
    }
}

/**
 * Apply comment gutters to all code cells in a notebook panel.
 */
function applyGutterToAllCells(notebookPanel: NotebookPanel): void {
    const notebook = notebookPanel.content;
    if (!notebook) {
        return;
    }
    for (const cell of notebook.widgets) {
        if (cell instanceof CodeCell) {
            applyGutterToCell(cell);
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

const CommentsPlugin: JupyterFrontEndPlugin<void> = {
    id: 'mito_ai:comments',
    description: 'Adds comment gutter icons to code cells and output comment toolbar button',
    autoStart: true,
    requires: [INotebookTracker],
    activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
        const { commands } = app;

        // Listen for comment gutter clicks anywhere in the document
        document.addEventListener(COMMENT_GUTTER_CLICK_EVENT, ((e: CustomEvent<CommentGutterClickDetail>) => {
            const { lineNumber, rect } = e.detail;

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

            // Get the selection range or current line
            const state = editorView.state;
            const selection = state.selection.main;
            let startLine: number;
            let endLine: number;
            let selectedCode: string;

            if (selection.from !== selection.to) {
                startLine = state.doc.lineAt(selection.from).number - 1; // 0-indexed
                endLine = state.doc.lineAt(selection.to).number - 1;
                selectedCode = state.sliceDoc(selection.from, selection.to);
            } else {
                startLine = lineNumber - 1; // 0-indexed
                endLine = lineNumber - 1;
                const line = state.doc.line(lineNumber);
                selectedCode = line.text;
            }

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

        // Register the output comment toolbar button command
        commands.addCommand('toolbar-button:comment-on-output', {
            icon: commentLabIcon,
            caption: 'Comment on output for AI',
            execute: () => {
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
                const outputNode = activeCell.outputArea?.node;
                if (!outputNode) {
                    return;
                }

                const outputRect = outputNode.getBoundingClientRect();

                showCommentPopover(
                    { ...outputRect, bottom: outputRect.top, left: outputRect.right - 300 } as DOMRect,
                    async (comment: string) => {
                        const truncatedDisplay = comment.length > 30
                            ? comment.substring(0, 30) + '...'
                            : comment;

                        // Try to capture the output as base64
                        let outputSnapshot: string | undefined;
                        try {
                            outputSnapshot = await getCellOutputByID(notebookTracker, cellId);
                        } catch {
                            // Fall back to text content
                        }

                        const outputTextContent = getOutputTextContent(activeCell as CodeCell);

                        const value = JSON.stringify({
                            cellId,
                            cellNumber,
                            comment,
                            outputSnapshot: outputSnapshot || undefined,
                            outputTextContent: outputTextContent || undefined,
                        });

                        void commands.execute(COMMAND_MITO_AI_ADD_OUTPUT_COMMENT, {
                            value,
                            display: truncatedDisplay,
                        });
                    }
                );
            },
            isVisible: () => {
                const activeCell = notebookTracker.currentWidget?.content.activeCell;
                if (!activeCell || !(activeCell instanceof CodeCell)) {
                    return false;
                }
                return (activeCell.outputArea?.model.length ?? 0) > 0;
            }
        });

        // Apply gutter extension to existing notebooks and new ones
        const setupNotebook = (notebookPanel: NotebookPanel): void => {
            notebookPanel.revealed.then(() => {
                applyGutterToAllCells(notebookPanel);

                // Listen for new cells being added
                const notebook = notebookPanel.content;
                notebook.model?.cells.changed.connect(() => {
                    setTimeout(() => applyGutterToAllCells(notebookPanel), 100);
                });
            }).catch(() => {
                // Ignore errors during setup
            });
        };

        notebookTracker.forEach(widget => setupNotebook(widget));
        notebookTracker.widgetAdded.connect((_sender, widget) => {
            setupNotebook(widget);
        });

        console.log('mito-ai: CommentsPlugin activated');
    }
};

export default CommentsPlugin;

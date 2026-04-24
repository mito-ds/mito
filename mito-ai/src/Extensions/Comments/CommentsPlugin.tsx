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
import { commentSelectionExtension, COMMENT_TOOLTIP_CLICK_EVENT, CommentTooltipClickDetail, dismissCommentTooltip } from './AddCommentBubble';
import { COMMAND_MITO_AI_ADD_CODE_COMMENT, COMMAND_MITO_AI_ADD_OUTPUT_COMMENT } from '../../commands';
import { getCellNumberById } from '../../utils/cellReferences';
import TextAndIconButton from '../../components/TextAndIconButton';
import CommentIcon from '../../icons/CommentIcon';

import '../../../style/Comments.css';

// Track compartments and the EditorView they were applied to, keyed by cell ID
const commentSelectionCompartments = new Map<string, { compartment: Compartment; view: any }>();

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

    // Position the popover, keeping it within the viewport on all sides
    const popoverWidth = 320;
    const popoverHeight = 160; // approximate: textarea + buttons + padding
    const gap = 4;
    const margin = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Vertical: prefer below the button, flip above if it would overflow bottom
    if (rect.bottom + gap + popoverHeight > vh - margin) {
        popover.style.bottom = `${vh - rect.top + gap}px`;
    } else {
        popover.style.top = `${rect.bottom + gap}px`;
    }

    // Horizontal: prefer aligning right edges, but shift if it would overflow left or right
    const rightEdge = vw - rect.right;
    if (rect.right - popoverWidth < margin) {
        // Would overflow left — align left edge with margin
        popover.style.left = `${Math.max(margin, rect.left)}px`;
    } else if (rect.right > vw - margin) {
        // Button itself is near right edge — anchor to right margin
        popover.style.right = `${margin}px`;
    } else {
        popover.style.right = `${rightEdge}px`;
    }

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
    outputCommentRoots.set(commentBtnDiv, root);

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

            // Scope observer to the notebook node, not document.body
            const observer = new MutationObserver(() => {
                injectAllForPanel(notebookPanel);
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

        console.log('mito-ai: CommentsPlugin activated');
    }
};

export default CommentsPlugin;

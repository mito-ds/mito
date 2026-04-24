/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Extension, StateField, StateEffect } from '@codemirror/state';
import {
    EditorView,
    showTooltip,
    Tooltip,
} from '@codemirror/view';

/**
 * A custom event dispatched when the "+ Add comment" button is clicked.
 * The detail contains the bounding rect for positioning the comment popover.
 */
export const COMMENT_TOOLTIP_CLICK_EVENT = 'mito-ai-comment-tooltip-click';

export interface CommentTooltipClickDetail {
    rect: DOMRect;
}

// Speech bubble SVG used in the button
const COMMENT_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"/></svg>`;

/**
 * An effect used to dismiss the tooltip (e.g., after the user clicks the button).
 */
const dismissTooltip = StateEffect.define<null>();

/**
 * State field that tracks whether there is a non-empty text selection,
 * and if so, provides a tooltip positioned at the selection head.
 */
const commentTooltipField = StateField.define<Tooltip | null>({
    create(state) {
        const sel = state.selection.main;
        if (sel.from === sel.to) {
            return null;
        }
        return makeTooltip(sel.head);
    },
    update(value, tr) {
        // Check if the tooltip was explicitly dismissed
        for (const effect of tr.effects) {
            if (effect.is(dismissTooltip)) {
                return null;
            }
        }

        if (!tr.selection && !tr.docChanged) {
            return value;
        }

        const sel = tr.state.selection.main;
        if (sel.from === sel.to) {
            return null;
        }
        return makeTooltip(sel.head);
    },
    provide: (field) => showTooltip.from(field),
});

function makeTooltip(pos: number): Tooltip {
    return {
        pos,
        above: true,
        create: () => {
            const dom = document.createElement('div');
            dom.className = 'cm-comment-tooltip';

            const btn = document.createElement('button');
            btn.className = 'cm-comment-tooltip-button';
            btn.innerHTML = `${COMMENT_SVG} <span>Add comment</span>`;
            btn.title = 'Add a comment for the AI';

            btn.addEventListener('mousedown', (e) => {
                // Use mousedown instead of click to fire before the editor
                // loses focus and clears the selection
                e.preventDefault();
                e.stopPropagation();

                const rect = btn.getBoundingClientRect();
                btn.dispatchEvent(new CustomEvent(COMMENT_TOOLTIP_CLICK_EVENT, {
                    bubbles: true,
                    detail: { rect } as CommentTooltipClickDetail,
                }));
            });

            dom.appendChild(btn);
            return { dom };
        },
    };
}

/**
 * Creates the CodeMirror extension that shows a "+ Add comment" tooltip
 * when the user has text selected in a code cell.
 */
export function commentSelectionExtension(): Extension {
    return [
        commentTooltipField,
        EditorView.baseTheme({
            // Override the default CM tooltip container styling
            '.cm-tooltip.cm-tooltip-above': {
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none',
                padding: '0',
            },
            '.cm-comment-tooltip': {
                padding: '0',
                border: 'none',
                background: 'none',
            },
            '.cm-comment-tooltip-button': {
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--purple-400)',
                color: 'var(--purple-700)',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                whiteSpace: 'nowrap' as any,
                transition: 'background-color 0.15s ease',
            },
            '.cm-comment-tooltip-button:hover': {
                backgroundColor: 'var(--purple-500)',
            },
            '.cm-comment-tooltip-button span': {
                lineHeight: '1',
            },
        }),
    ];
}

/**
 * Dispatch the dismiss effect to hide the tooltip for a given editor view.
 */
export function dismissCommentTooltip(view: EditorView): void {
    view.dispatch({ effects: dismissTooltip.of(null) });
}

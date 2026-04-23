/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Extension, RangeSetBuilder } from '@codemirror/state';
import {
    EditorView,
    GutterMarker,
    gutter,
    ViewPlugin,
    ViewUpdate,
} from '@codemirror/view';

/**
 * A custom event dispatched when a comment gutter icon is clicked.
 * The detail contains the line number (1-indexed) and the bounding rect for positioning the popover.
 */
export const COMMENT_GUTTER_CLICK_EVENT = 'mito-ai-comment-gutter-click';

export interface CommentGutterClickDetail {
    lineNumber: number;
    rect: DOMRect;
}

// Speech bubble SVG for the gutter marker
const COMMENT_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" fill="currentColor"/></svg>`;

class CommentMarker extends GutterMarker {
    private lineNumber: number;

    constructor(lineNumber: number) {
        super();
        this.lineNumber = lineNumber;
    }

    toDOM(): HTMLElement {
        const wrapper = document.createElement('div');
        wrapper.className = 'comment-gutter-marker';
        wrapper.innerHTML = COMMENT_SVG;
        wrapper.title = 'Add comment for AI';
        wrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = wrapper.getBoundingClientRect();
            wrapper.dispatchEvent(new CustomEvent(COMMENT_GUTTER_CLICK_EVENT, {
                bubbles: true,
                detail: {
                    lineNumber: this.lineNumber,
                    rect,
                } as CommentGutterClickDetail
            }));
        });
        return wrapper;
    }
}

/**
 * A ViewPlugin that tracks which line the cursor is on to show the gutter marker.
 */
const commentGutterPlugin = ViewPlugin.fromClass(
    class {
        cursorLine: number;

        constructor(view: EditorView) {
            this.cursorLine = view.state.doc.lineAt(view.state.selection.main.head).number;
        }

        update(update: ViewUpdate): void {
            if (update.selectionSet || update.docChanged) {
                this.cursorLine = update.state.doc.lineAt(update.state.selection.main.head).number;
            }
        }
    }
);

/**
 * The comment gutter itself. Shows a speech bubble icon on the line where the cursor is.
 */
const commentGutter = gutter({
    class: 'cm-commentGutter',
    markers: (view) => {
        const plugin = view.plugin(commentGutterPlugin);
        if (!plugin) {
            const emptyBuilder = new RangeSetBuilder<GutterMarker>();
            return emptyBuilder.finish();
        }

        const cursorLine = plugin.cursorLine;
        const line = view.state.doc.line(cursorLine);

        const builder = new RangeSetBuilder<GutterMarker>();
        builder.add(line.from, line.from, new CommentMarker(cursorLine));
        return builder.finish();
    },
    initialSpacer: () => new CommentMarker(0),
});

/**
 * Creates the CodeMirror extension that adds a comment gutter to the editor.
 * The gutter shows a speech bubble icon on the current cursor line.
 * Clicking the icon dispatches a COMMENT_GUTTER_CLICK_EVENT custom event.
 */
export function commentGutterExtension(): Extension {
    return [
        commentGutterPlugin,
        commentGutter,
    ];
}

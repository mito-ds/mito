/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Extension, RangeSetBuilder } from '@codemirror/state';
import { EditorView, gutter, GutterMarker } from '@codemirror/view';

export interface CommentLineRange {
    startLine: number; // 0-indexed
    endLine: number;   // 0-indexed
}

/**
 * Custom DOM event dispatched when the user clicks a comment gutter indicator.
 */
export const COMMENT_INDICATOR_CLICK_EVENT = 'mito-ai-comment-indicator-click';

export interface CommentIndicatorClickDetail {
    lineNumber: number; // 0-indexed line that was clicked
}

class CommentBarMarker extends GutterMarker {
    toDOM(): HTMLElement {
        const el = document.createElement('div');
        el.className = 'cm-comment-indicator-bar';
        return el;
    }
}

const commentBarMarker = new CommentBarMarker();

/**
 * Creates a CM6 gutter extension that shows a thin purple vertical bar
 * on lines that have comments. Clicking the bar dispatches a custom event.
 */
export function commentGutterIndicator(ranges: CommentLineRange[]): Extension {
    return [
        gutter({
            class: 'cm-comment-gutter',
            markers(view) {
                const builder = new RangeSetBuilder<GutterMarker>();
                const doc = view.state.doc;
                for (const range of ranges) {
                    // Convert 0-indexed lines to 1-indexed for CM6 doc
                    for (let line = range.startLine; line <= range.endLine; line++) {
                        const lineNum = line + 1;
                        if (lineNum >= 1 && lineNum <= doc.lines) {
                            const lineStart = doc.line(lineNum).from;
                            builder.add(lineStart, lineStart, commentBarMarker);
                        }
                    }
                }
                return builder.finish();
            },
            domEventHandlers: {
                click(view, line) {
                    const lineNumber = view.state.doc.lineAt(line.from).number - 1;
                    view.dom.dispatchEvent(
                        new CustomEvent<CommentIndicatorClickDetail>(
                            COMMENT_INDICATOR_CLICK_EVENT,
                            { detail: { lineNumber }, bubbles: true }
                        )
                    );
                    return true;
                },
            },
        }),
        EditorView.baseTheme({
            '.cm-comment-gutter': {
                width: '4px',
                padding: '0',
                cursor: 'pointer',
            },
            '.cm-comment-indicator-bar': {
                backgroundColor: 'var(--purple-500)',
                width: '100%',
                height: '100%',
            },
        }),
    ];
}

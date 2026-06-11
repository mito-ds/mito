/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Extension, RangeSetBuilder } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, gutter, GutterMarker, ViewPlugin, ViewUpdate } from '@codemirror/view';

export const VERIFIED_SNIPPET_INDICATOR_CLICK_EVENT = 'mito-ai-verified-snippet-indicator-click';

export interface VerifiedSnippetIndicatorClickDetail {
    reportName: string;
    snippetId: string;
    // Screen position of the hovered line, used to anchor the hover card.
    rect: DOMRect;
}

class VerifiedBarMarker extends GutterMarker {
    toDOM(): HTMLElement {
        const el = document.createElement('div');
        el.className = 'cm-verified-snippet-indicator-bar';
        return el;
    }
}

const verifiedBarMarker = new VerifiedBarMarker();

const verifiedLineDecoration = Decoration.line({
    attributes: { class: 'cm-verified-snippet-line' },
});

function buildLineDecorations(view: EditorView, startLine: number, endLine: number): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const doc = view.state.doc;
    for (let line = startLine; line <= endLine; line++) {
        const lineNum = line + 1;
        if (lineNum >= 1 && lineNum <= doc.lines) {
            const lineStart = doc.line(lineNum).from;
            builder.add(lineStart, lineStart, verifiedLineDecoration);
        }
    }
    return builder.finish();
}

export function verifiedSnippetIndicatorExtension(
    startLine: number,
    endLine: number,
    reportName: string,
    snippetId: string,
): Extension {
    const lineDecorationsPlugin = ViewPlugin.fromClass(class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = buildLineDecorations(view, startLine, endLine);
        }

        update(update: ViewUpdate): void {
            if (update.docChanged) {
                this.decorations = buildLineDecorations(update.view, startLine, endLine);
            }
        }
    }, {
        decorations: (v) => v.decorations,
    });

    return [
        lineDecorationsPlugin,
        gutter({
            class: 'cm-verified-snippet-gutter',
            markers(view) {
                const builder = new RangeSetBuilder<GutterMarker>();
                const doc = view.state.doc;
                for (let line = startLine; line <= endLine; line++) {
                    const lineNum = line + 1;
                    if (lineNum >= 1 && lineNum <= doc.lines) {
                        const lineStart = doc.line(lineNum).from;
                        builder.add(lineStart, lineStart, verifiedBarMarker);
                    }
                }
                return builder.finish();
            },
            domEventHandlers: {
                mouseenter(view, line) {
                    const coords = view.coordsAtPos(line.from);
                    const rect = new DOMRect(
                        coords?.left ?? 0,
                        coords?.top ?? 0,
                        0,
                        coords ? coords.bottom - coords.top : 20,
                    );
                    view.dom.dispatchEvent(
                        new CustomEvent<VerifiedSnippetIndicatorClickDetail>(
                            VERIFIED_SNIPPET_INDICATOR_CLICK_EVENT,
                            {
                                detail: { reportName, snippetId, rect },
                                bubbles: true,
                            }
                        )
                    );
                    return false;
                },
            },
        }),
        EditorView.baseTheme({
            '.cm-verified-snippet-line': {
                backgroundColor: 'rgba(92, 196, 196, 0.15)',
                borderLeft: '3px solid var(--teal-500, #5cc4c4)',
            },
            '.cm-verified-snippet-gutter': {
                width: '4px',
                padding: '0',
                cursor: 'pointer',
            },
            '.cm-verified-snippet-indicator-bar': {
                backgroundColor: 'var(--teal-500, #5cc4c4)',
                width: '100%',
                height: '100%',
            },
        }),
    ];
}

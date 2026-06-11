/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { Extension, RangeSetBuilder } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';

export const VERIFIED_SNIPPET_INDICATOR_HOVER_EVENT = 'mito-ai-verified-snippet-indicator-hover';
export const VERIFIED_SNIPPET_INDICATOR_LEAVE_EVENT = 'mito-ai-verified-snippet-indicator-leave';

export interface VerifiedSnippetIndicatorHoverDetail {
    reportName: string;
    snippetId: string;
    // Screen position of the badge, used to anchor the hover card.
    rect: DOMRect;
}

class VerifiedBadgeWidget extends WidgetType {
    constructor(
        private readonly reportName: string,
        private readonly snippetId: string,
    ) {
        super();
    }

    override eq(other: VerifiedBadgeWidget): boolean {
        return other.reportName === this.reportName && other.snippetId === this.snippetId;
    }

    toDOM(): HTMLElement {
        const badge = document.createElement('span');
        badge.className = 'cm-verified-snippet-badge';
        badge.textContent = '✓ Verified';

        badge.addEventListener('mouseenter', () => {
            badge.dispatchEvent(
                new CustomEvent<VerifiedSnippetIndicatorHoverDetail>(
                    VERIFIED_SNIPPET_INDICATOR_HOVER_EVENT,
                    {
                        detail: {
                            reportName: this.reportName,
                            snippetId: this.snippetId,
                            rect: badge.getBoundingClientRect(),
                        },
                        bubbles: true,
                    }
                )
            );
        });
        badge.addEventListener('mouseleave', () => {
            badge.dispatchEvent(
                new CustomEvent(VERIFIED_SNIPPET_INDICATOR_LEAVE_EVENT, { bubbles: true })
            );
        });

        return badge;
    }

    override ignoreEvent(): boolean {
        return false;
    }
}

const verifiedLineDecoration = Decoration.line({
    attributes: { class: 'cm-verified-snippet-line' },
});

function buildDecorations(
    view: EditorView,
    startLine: number,
    endLine: number,
    reportName: string,
    snippetId: string,
): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const doc = view.state.doc;
    for (let line = startLine; line <= endLine; line++) {
        const lineNum = line + 1;
        if (lineNum >= 1 && lineNum <= doc.lines) {
            const lineStart = doc.line(lineNum).from;
            builder.add(lineStart, lineStart, verifiedLineDecoration);
            if (line === startLine) {
                builder.add(
                    doc.line(lineNum).to,
                    doc.line(lineNum).to,
                    Decoration.widget({
                        widget: new VerifiedBadgeWidget(reportName, snippetId),
                        side: 1,
                    }),
                );
            }
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
    const decorationsPlugin = ViewPlugin.fromClass(class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = buildDecorations(view, startLine, endLine, reportName, snippetId);
        }

        update(update: ViewUpdate): void {
            if (update.docChanged) {
                this.decorations = buildDecorations(update.view, startLine, endLine, reportName, snippetId);
            }
        }
    }, {
        decorations: (v) => v.decorations,
    });

    return [
        decorationsPlugin,
        EditorView.baseTheme({
            '.cm-verified-snippet-line': {
                backgroundColor: 'rgba(92, 196, 196, 0.10)',
            },
        }),
    ];
}

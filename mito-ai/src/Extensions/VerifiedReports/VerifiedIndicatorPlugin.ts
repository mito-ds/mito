/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { CodeCell } from '@jupyterlab/cells';
import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';
import { Compartment, StateEffect } from '@codemirror/state';
import { COMMAND_MITO_AI_OPEN_SETTINGS_VERIFIED_REPORTS } from '../../commands';
import { getVerifiedReport } from '../../restAPI/RestAPI';
import { getVerifiedSnippetMetadata } from '../../utils/verifiedSnippetMetadata';
import {
    verifiedSnippetIndicatorExtension,
    VERIFIED_SNIPPET_INDICATOR_CLICK_EVENT,
    VerifiedSnippetIndicatorClickDetail,
} from './verifiedSnippetIndicator';

import '../../../style/VerifiedSnippetIndicator.css';

const verifiedSnippetCompartments = new Map<string, { compartment: Compartment; view: unknown }>();

let activeHoverCard: HTMLElement | null = null;

function removeHoverCard(): void {
    if (activeHoverCard) {
        activeHoverCard.remove();
        activeHoverCard = null;
    }
}

function showVerifiedSnippetHoverCard(
    rect: DOMRect,
    reportName: string,
    comment: string,
    app: JupyterFrontEnd,
    snippetId: string,
    reportMissing: boolean,
): void {
    removeHoverCard();

    const card = document.createElement('div');
    card.className = 'verified-snippet-hover-card';

    const title = document.createElement('div');
    title.className = 'verified-snippet-hover-card-title';
    title.textContent = reportMissing
        ? 'Verified report no longer exists'
        : `Inspired by Verified Report: ${reportName}`;

    const body = document.createElement('div');
    body.className = 'verified-snippet-hover-card-body';
    body.textContent = reportMissing ? '' : comment;

    card.appendChild(title);
    if (!reportMissing && comment) {
        card.appendChild(body);
    }

    if (!reportMissing) {
        const link = document.createElement('button');
        link.className = 'verified-snippet-hover-card-link';
        link.textContent = 'View snippet';
        link.addEventListener('click', () => {
            removeHoverCard();
            void app.commands.execute(COMMAND_MITO_AI_OPEN_SETTINGS_VERIFIED_REPORTS, {
                reportName,
                snippetId,
            });
        });
        card.appendChild(link);
    }

    card.style.position = 'fixed';
    card.style.top = `${rect.bottom + 4}px`;
    card.style.left = `${Math.min(rect.left, window.innerWidth - 320)}px`;

    document.body.appendChild(card);
    activeHoverCard = card;
}

function applyIndicatorToCell(cell: CodeCell): void {
    const metadata = getVerifiedSnippetMetadata(cell.model);
    if (!metadata) {
        removeIndicatorFromCell(cell.model.id);
        return;
    }

    const cmEditor = cell.editor as { editor?: { dispatch: (spec: unknown) => void } };
    const editorView = cmEditor?.editor;
    if (!editorView) {
        return;
    }

    const cellId = cell.model.id;
    const existing = verifiedSnippetCompartments.get(cellId);
    if (existing && existing.view === editorView) {
        return;
    }

    const compartment = new Compartment();
    verifiedSnippetCompartments.set(cellId, { compartment, view: editorView });
    editorView.dispatch({
        effects: StateEffect.appendConfig.of(
            compartment.of(verifiedSnippetIndicatorExtension(
                metadata.startLine,
                metadata.endLine,
                metadata.reportName,
                metadata.snippetId,
            ))
        ),
    });
}

function removeIndicatorFromCell(cellId: string): void {
    verifiedSnippetCompartments.delete(cellId);
}

function applyIndicatorsToNotebook(notebookPanel: NotebookPanel): void {
    for (const cell of notebookPanel.content.widgets) {
        if (cell instanceof CodeCell) {
            applyIndicatorToCell(cell);
        }
    }
}

const VerifiedIndicatorPlugin: JupyterFrontEndPlugin<void> = {
    id: 'mito-ai:verified-indicator',
    description: 'Shows line-level indicators for code inspired by verified report snippets',
    autoStart: true,
    requires: [INotebookTracker],
    activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
        const setupNotebook = (notebookPanel: NotebookPanel): void => {
            notebookPanel.revealed.then(() => {
                applyIndicatorsToNotebook(notebookPanel);

                notebookPanel.content.model?.cells.changed.connect(() => {
                    setTimeout(() => applyIndicatorsToNotebook(notebookPanel), 100);
                });

                notebookPanel.content.activeCellChanged.connect(() => {
                    const activeCell = notebookPanel.content.activeCell;
                    if (activeCell instanceof CodeCell) {
                        applyIndicatorToCell(activeCell);
                    }
                });

                for (const cell of notebookPanel.content.widgets) {
                    if (cell instanceof CodeCell) {
                        cell.model.metadataChanged.connect(() => {
                            applyIndicatorToCell(cell);
                        });
                    }
                }
            }).catch(() => undefined);
        };

        notebookTracker.forEach(widget => setupNotebook(widget));
        notebookTracker.widgetAdded.connect((_sender, widget) => {
            setupNotebook(widget);
        });

        document.addEventListener(VERIFIED_SNIPPET_INDICATOR_CLICK_EVENT, ((e: CustomEvent<VerifiedSnippetIndicatorClickDetail>) => {
            const { reportName, snippetId, lineNumber } = e.detail;

            const notebookPanel = notebookTracker.currentWidget;
            if (!notebookPanel) {
                return;
            }

            const activeCell = notebookPanel.content.activeCell;
            if (!activeCell || !(activeCell instanceof CodeCell)) {
                return;
            }

            const cmEditor = activeCell.editor as { editor?: { state: { doc: { line: (n: number) => { from: number } } }; coordsAtPos: (pos: number) => { left: number; top: number; bottom: number } | null } };
            const editorView = cmEditor?.editor;
            if (!editorView) {
                return;
            }

            const lineInfo = editorView.state.doc.line(lineNumber + 1);
            const coords = editorView.coordsAtPos(lineInfo.from);
            const rect = new DOMRect(coords?.left || 0, coords?.top || 0, 0, coords ? coords.bottom - coords.top : 20);

            void getVerifiedReport(reportName).then(report => {
                const snippet = report.snippets.find(s => s.id === snippetId);
                showVerifiedSnippetHoverCard(
                    rect,
                    reportName,
                    snippet?.comment || '',
                    app,
                    snippetId,
                    false,
                );
            }).catch(() => {
                showVerifiedSnippetHoverCard(rect, reportName, '', app, snippetId, true);
            });
        }) as EventListener);

        document.addEventListener('mousedown', (e) => {
            if (activeHoverCard && !activeHoverCard.contains(e.target as Node)) {
                removeHoverCard();
            }
        });
    },
};

export default VerifiedIndicatorPlugin;

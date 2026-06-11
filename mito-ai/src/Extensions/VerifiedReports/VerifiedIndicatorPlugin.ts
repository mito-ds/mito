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
    VERIFIED_SNIPPET_INDICATOR_HOVER_EVENT,
    VERIFIED_SNIPPET_INDICATOR_LEAVE_EVENT,
    VerifiedSnippetIndicatorHoverDetail,
} from './verifiedSnippetIndicator';

import '../../../style/VerifiedSnippetIndicator.css';

interface IEditorViewLike {
    dispatch: (spec: unknown) => void;
}

const verifiedSnippetCompartments = new Map<string, { compartment: Compartment; view: IEditorViewLike; metadataKey: string }>();

// Tracks cell models that already have a metadataChanged listener attached.
const modelsWithMetadataListener = new WeakSet<object>();

let activeHoverCard: HTMLElement | null = null;
let hoverCardRemovalTimeout: number | undefined;

function removeHoverCard(): void {
    if (hoverCardRemovalTimeout !== undefined) {
        window.clearTimeout(hoverCardRemovalTimeout);
        hoverCardRemovalTimeout = undefined;
    }
    if (activeHoverCard) {
        activeHoverCard.remove();
        activeHoverCard = null;
    }
}

function scheduleHoverCardRemoval(delayMs: number): void {
    if (hoverCardRemovalTimeout !== undefined) {
        window.clearTimeout(hoverCardRemovalTimeout);
    }
    hoverCardRemovalTimeout = window.setTimeout(() => {
        removeHoverCard();
    }, delayMs);
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

    // Keep the card open while the pointer is over it; dismiss shortly after leaving.
    card.addEventListener('mouseenter', () => {
        if (hoverCardRemovalTimeout !== undefined) {
            window.clearTimeout(hoverCardRemovalTimeout);
            hoverCardRemovalTimeout = undefined;
        }
    });
    card.addEventListener('mouseleave', () => {
        scheduleHoverCardRemoval(300);
    });

    document.body.appendChild(card);
    activeHoverCard = card;
    // Auto-dismiss if the user never moves the pointer into the card.
    scheduleHoverCardRemoval(4000);
}

function applyIndicatorToCell(cell: CodeCell): void {
    const cellId = cell.model.id;
    const metadata = getVerifiedSnippetMetadata(cell.model);
    const cmEditor = cell.editor as { editor?: IEditorViewLike };
    const editorView = cmEditor?.editor;

    if (!metadata) {
        // Metadata was removed: clear the indicator extension if it was applied.
        const existing = verifiedSnippetCompartments.get(cellId);
        if (existing) {
            existing.view.dispatch({
                effects: existing.compartment.reconfigure([]),
            });
            verifiedSnippetCompartments.delete(cellId);
        }
        return;
    }

    if (!editorView) {
        return;
    }

    const metadataKey = `${metadata.reportName}:${metadata.snippetId}:${metadata.startLine}:${metadata.endLine}`;
    const extension = verifiedSnippetIndicatorExtension(
        metadata.startLine,
        metadata.endLine,
        metadata.reportName,
        metadata.snippetId,
    );

    const existing = verifiedSnippetCompartments.get(cellId);
    if (existing && existing.view === editorView) {
        if (existing.metadataKey === metadataKey) {
            return;
        }
        // The snippet ref changed (e.g. the agent updated this cell again):
        // swap in the new line range/report.
        existing.view.dispatch({
            effects: existing.compartment.reconfigure(extension),
        });
        existing.metadataKey = metadataKey;
        return;
    }

    const compartment = new Compartment();
    verifiedSnippetCompartments.set(cellId, { compartment, view: editorView, metadataKey });
    editorView.dispatch({
        effects: StateEffect.appendConfig.of(compartment.of(extension)),
    });
}

/**
 * Apply the indicator to a cell, retrying a few times in case the CodeMirror
 * editor view isn't attached yet (e.g. right after the agent creates a cell).
 */
export function scheduleApplyIndicatorToCell(cell: CodeCell): void {
    const delays = [0, 100, 300];
    for (const delay of delays) {
        window.setTimeout(() => applyIndicatorToCell(cell), delay);
    }
}

function applyIndicatorsToNotebook(notebookPanel: NotebookPanel): void {
    for (const cell of notebookPanel.content.widgets) {
        if (cell instanceof CodeCell) {
            applyIndicatorToCell(cell);

            // Attach a metadata listener once per cell model so cells added
            // after notebook setup (e.g. created by the agent) also update.
            if (!modelsWithMetadataListener.has(cell.model)) {
                modelsWithMetadataListener.add(cell.model);
                cell.model.metadataChanged.connect(() => {
                    applyIndicatorToCell(cell);
                });
            }
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
            }).catch(() => undefined);
        };

        notebookTracker.forEach(widget => setupNotebook(widget));
        notebookTracker.widgetAdded.connect((_sender, widget) => {
            setupNotebook(widget);
        });

        document.addEventListener(VERIFIED_SNIPPET_INDICATOR_HOVER_EVENT, ((e: CustomEvent<VerifiedSnippetIndicatorHoverDetail>) => {
            const { reportName, snippetId, rect } = e.detail;

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

        document.addEventListener(VERIFIED_SNIPPET_INDICATOR_LEAVE_EVENT, () => {
            // Give the user time to move the pointer into the hover card,
            // whose own mouseenter cancels this removal.
            scheduleHoverCardRemoval(300);
        });

        document.addEventListener('mousedown', (e) => {
            if (activeHoverCard && !activeHoverCard.contains(e.target as Node)) {
                removeHoverCard();
            }
        });
    },
};

export default VerifiedIndicatorPlugin;

/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import * as http from 'http';
import * as vscode from 'vscode';

const RENDERER_ID = 'mito-vscode-renderer';
const MITO_MIME = 'application/x-mito';
const POLL_INTERVAL_MS = 500;

/**
 * Tracks active Mito sessions. Keyed by sessionId.
 */
interface Session {
    port: number;
    notebookUri: string;
    lastVersion: number;
    timer: NodeJS.Timeout;
}

const sessions = new Map<string, Session>();

export function activate(context: vscode.ExtensionContext): void {
    const messaging = vscode.notebooks.createRendererMessaging(RENDERER_ID);

    messaging.onDidReceiveMessage(({ editor, message }) => {
        if (message.type !== 'mito:register') {
            return;
        }

        const { port, sessionId } = message as { port: number; sessionId: string };

        // Stop any existing polling for this session (e.g. kernel restart)
        stopSession(sessionId);

        const timer = setInterval(
            () => pollAndUpdate(editor.notebook, sessionId, port),
            POLL_INTERVAL_MS
        );

        sessions.set(sessionId, {
            port,
            notebookUri: editor.notebook.uri.toString(),
            lastVersion: -1,
            timer,
        });

        context.subscriptions.push({ dispose: () => stopSession(sessionId) });
    });
}

export function deactivate(): void {
    for (const sessionId of sessions.keys()) {
        stopSession(sessionId);
    }
}

function stopSession(sessionId: string): void {
    const session = sessions.get(sessionId);
    if (session) {
        clearInterval(session.timer);
        sessions.delete(sessionId);
    }
}

async function pollAndUpdate(
    notebook: vscode.NotebookDocument,
    sessionId: string,
    port: number
): Promise<void> {
    const session = sessions.get(sessionId);
    if (!session) {
        return;
    }

    let result: { code: string; version: number };
    try {
        result = await fetchCode(port);
    } catch {
        // Server gone (kernel restarted etc.) — stop polling
        stopSession(sessionId);
        return;
    }

    if (result.version <= session.lastVersion) {
        return;
    }

    session.lastVersion = result.version;
    await writeCodeCell(notebook, sessionId, result.code);
}

function fetchCode(port: number): Promise<{ code: string; version: number }> {
    return new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${port}/code`, (res) => {
            let raw = '';
            res.on('data', (chunk: string) => (raw += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(raw));
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(2000, () => {
            req.destroy();
            reject(new Error('timeout'));
        });
    });
}

async function writeCodeCell(
    notebook: vscode.NotebookDocument,
    sessionId: string,
    code: string
): Promise<void> {
    // Find the cell whose output contains the application/x-mito item with this sessionId
    let mitoCellIndex = -1;
    for (let i = 0; i < notebook.cellCount; i++) {
        const cell = notebook.cellAt(i);
        for (const output of cell.outputs) {
            for (const item of output.items) {
                if (item.mime === MITO_MIME) {
                    try {
                        const data = JSON.parse(new TextDecoder().decode(item.data));
                        if (data.session_id === sessionId) {
                            mitoCellIndex = i;
                        }
                    } catch {
                        // ignore malformed output
                    }
                }
            }
        }
    }

    if (mitoCellIndex === -1) {
        return;
    }

    const targetIndex = mitoCellIndex + 1;
    const edit = new vscode.WorkspaceEdit();

    // Check whether the cell immediately below is already our generated cell
    const isOurCell =
        targetIndex < notebook.cellCount &&
        notebook.cellAt(targetIndex).metadata?.mito_session_id === sessionId;

    if (isOurCell) {
        // Replace it in-place
        edit.set(notebook.uri, [
            vscode.NotebookEdit.replaceCells(
                new vscode.NotebookRange(targetIndex, targetIndex + 1),
                [makeCellData(code, sessionId)]
            ),
        ]);
    } else {
        // Insert a fresh cell below the Mito output cell
        edit.set(notebook.uri, [
            vscode.NotebookEdit.insertCells(targetIndex, [makeCellData(code, sessionId)]),
        ]);
    }

    await vscode.workspace.applyEdit(edit);
}

function makeCellData(code: string, sessionId: string): vscode.NotebookCellData {
    const cell = new vscode.NotebookCellData(
        vscode.NotebookCellKind.Code,
        code,
        'python'
    );
    cell.metadata = { mito_session_id: sessionId };
    return cell;
}

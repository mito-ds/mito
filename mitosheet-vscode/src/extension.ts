/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import * as http from 'http';
import * as vscode from 'vscode';

const RENDERER_ID = 'mitosheet-vscode-renderer';
const MITO_MIME = 'application/x-mitosheet';
const POLL_INTERVAL_MS = 500;

/**
 * Tracks active Mito sessions. Keyed by sessionId.
 */
interface Session {
    port: number;
    notebookUri: string;
    lastVersion: number;
    timer: NodeJS.Timeout;
    // Set to true while a poll is mid-flight so the next setInterval tick
    // can skip itself. Without this, two concurrent pollAndUpdate calls
    // both read the pre-edit notebook state and both insert a fresh
    // analysis cell, producing duplicates.
    inFlight: boolean;
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
            inFlight: false,
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
    if (!session || session.inFlight) {
        return;
    }

    session.inFlight = true;
    try {
        let result: { code: string; version: number; analysis_name: string };
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
        await writeCodeCell(notebook, sessionId, result.code, result.analysis_name);
    } finally {
        session.inFlight = false;
    }
}

function fetchCode(port: number): Promise<{ code: string; version: number; analysis_name: string }> {
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
    code: string,
    analysisName: string
): Promise<void> {
    // Find the cell whose output contains the application/x-mitosheet item with this sessionId
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

    // Check whether the cell immediately below is already a Mito-generated
    // analysis cell. We detect this from the cell content (via the standard
    // `from mitosheet.public.vN import *` boilerplate the transpiler emits)
    // rather than via custom metadata, because VS Code's Jupyter serializer
    // strips unrecognized cell metadata on save.
    const isOurCell =
        targetIndex < notebook.cellCount &&
        isMitoGeneratedCell(notebook.cellAt(targetIndex));

    if (isOurCell) {
        // Replace it in-place
        edit.set(notebook.uri, [
            vscode.NotebookEdit.replaceCells(
                new vscode.NotebookRange(targetIndex, targetIndex + 1),
                [makeCellData(code)]
            ),
        ]);
    } else {
        // Insert a fresh cell below the Mito output cell
        edit.set(notebook.uri, [
            vscode.NotebookEdit.insertCells(targetIndex, [makeCellData(code)]),
        ]);
    }

    // Also write analysis_to_replay="<analysisName>" into the originating
    // mitosheet.sheet() cell, so reruns pick up the analysis where it left off.
    const mitoCell = notebook.cellAt(mitoCellIndex);
    const cellSource = mitoCell.document.getText();
    const updatedSource = addAnalysisToReplayParameter(cellSource, analysisName);
    if (updatedSource !== undefined) {
        const fullRange = new vscode.Range(
            0,
            0,
            mitoCell.document.lineCount,
            0
        );
        edit.replace(mitoCell.document.uri, fullRange, updatedSource);
    }

    await vscode.workspace.applyEdit(edit);
}

/**
 * If `code` ends with a mitosheet.sheet(...) call that doesn't already include
 * an analysis_to_replay parameter, returns a new version with
 * analysis_to_replay="<analysisName>" added before the closing paren.
 * Otherwise returns undefined.
 */
function addAnalysisToReplayParameter(
    code: string,
    analysisName: string
): string | undefined {
    if (!isMitosheetCallCode(code)) {
        return undefined;
    }
    if (removeWhitespaceInPythonCode(code).includes('analysis_to_replay=')) {
        return undefined;
    }

    // We know the mitosheet.sheet() call is the last thing in the cell, so we
    // just replace the last closing paren.
    const lastIndex = code.lastIndexOf(')');
    if (lastIndex === -1) {
        return undefined;
    }
    const replacement = removeWhitespaceInPythonCode(code).includes('sheet()')
        ? `analysis_to_replay="${analysisName}")`
        : `, analysis_to_replay="${analysisName}")`;
    return code.substring(0, lastIndex) + replacement + code.substring(lastIndex + 1);
}

function isMitosheetCallCode(code: string): boolean {
    const lines = code.split(/\r?\n/).filter((line) => line.trim().length > 0);
    const lastLine = lines.length > 0 ? lines[lines.length - 1] : undefined;
    if (lastLine === undefined) {
        return false;
    }
    return removeWhitespaceInPythonCode(lastLine).includes('sheet(');
}

// Removes all whitespace from a string, except for whitespace in quoted strings.
function removeWhitespaceInPythonCode(code: string): string {
    const pattern = /('[^']*'|"[^"]*")/;
    const parts = code.split(pattern);
    const partsWithoutSpaces = parts.map((part) => {
        if (pattern.test(part)) {
            return part;
        }
        return part.replace(/\s+/g, '');
    });
    return partsWithoutSpaces.join('');
}

function makeCellData(code: string): vscode.NotebookCellData {
    return new vscode.NotebookCellData(
        vscode.NotebookCellKind.Code,
        code,
        'python'
    );
}

// Returns true if the given cell looks like a Mito-generated analysis cell.
// The transpiler always emits `from mitosheet.public.v<N> import *` as the
// first line, which is a reliable, content-only signal that survives saves.
function isMitoGeneratedCell(cell: vscode.NotebookCell): boolean {
    if (cell.kind !== vscode.NotebookCellKind.Code) {
        return false;
    }
    const text = cell.document.getText().trimStart();
    return /^from\s+mitosheet\.public\.v\d+\s+import\s+\*/.test(text);
}

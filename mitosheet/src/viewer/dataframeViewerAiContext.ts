/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { ColumnMetadata, SelectionBounds } from "./types";

/**
 * Must match mito-ai `COMMAND_MITO_AI_ADD_DATAFRAME_VIEWER_SELECTION` in commands.tsx.
 */
export const COMMAND_MITO_AI_ADD_DATAFRAME_VIEWER_SELECTION =
    "mito_ai:add-dataframe-viewer-selection";

/**
 * True when JupyterLab has registered the Mito AI command (extension loaded).
 * Uses the same `window.commands` registry as the mime renderer context.
 */
export function isMitoAiDataframeViewerSelectionCommandAvailable(): boolean {
    const w = window as Window & {
        commands?: { hasCommand?: (id: string) => boolean };
    };
    return (
        w.commands?.hasCommand?.(COMMAND_MITO_AI_ADD_DATAFRAME_VIEWER_SELECTION) ??
        false
    );
}

export function columnHeaderLabel(col: ColumnMetadata): string {
    return col.name.join(" / ");
}

/**
 * Markdown table + description for Mito AI additional context (dataframe_viewer_selection).
 */
export function buildDataframeViewerSelectionContext(
    bounds: SelectionBounds,
    sortedRows: any[][],
    columns: ColumnMetadata[]
): { display: string; value: string } {
    const { minRow, maxRow, minCol, maxCol } = bounds;
    const rowCount = maxRow - minRow + 1;
    const colCount = maxCol - minCol + 1;
    const headers: string[] = [];
    for (let c = minCol; c <= maxCol; c++) {
        headers.push(columnHeaderLabel(columns[c]));
    }
    const lines: string[] = [];
    lines.push("| " + headers.join(" | ") + " |");
    lines.push("| " + headers.map(() => "---").join(" | ") + " |");
    for (let r = minRow; r <= maxRow; r++) {
        const row = sortedRows[r];
        const cells: string[] = [];
        for (let c = minCol; c <= maxCol; c++) {
            const raw = row[c];
            const s =
                raw === null || raw === undefined
                    ? ""
                    : String(raw).replace(/\|/g, "\\|").replace(/\n/g, " ");
            cells.push(s);
        }
        lines.push("| " + cells.join(" | ") + " |");
    }
    const markdownTable = lines.join("\n");
    const value = markdownTable;
    const display = `DataFrame selection (${rowCount}×${colCount})`;
    return { display, value };
}

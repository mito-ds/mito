/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { CellPos, SelectionBounds } from "./types";

export function getSelectionBounds(anchor: CellPos, focus: CellPos): SelectionBounds {
    return {
        minRow: Math.min(anchor.row, focus.row),
        maxRow: Math.max(anchor.row, focus.row),
        minCol: Math.min(anchor.col, focus.col),
        maxCol: Math.max(anchor.col, focus.col),
    };
}

export function isCellInRange(row: number, col: number, bounds: SelectionBounds): boolean {
    return (
        row >= bounds.minRow &&
        row <= bounds.maxRow &&
        col >= bounds.minCol &&
        col <= bounds.maxCol
    );
}

/** From `.mito-viewer` (`--mito-viewer-selection-border`) */
const SELECTION_BORDER = "var(--mito-viewer-selection-border)";

/** Inset shadows for Excel-style outer border of the range (per cell) */
export function getRangeEdgeBoxShadow(
    row: number,
    col: number,
    bounds: SelectionBounds
): string {
    const w = "2px";
    const c = SELECTION_BORDER;
    const parts: string[] = [];
    if (row === bounds.minRow) {
        parts.push(`inset 0 ${w} 0 0 ${c}`);
    }
    if (row === bounds.maxRow) {
        parts.push(`inset 0 calc(-1 * ${w}) 0 0 ${c}`);
    }
    if (col === bounds.minCol) {
        parts.push(`inset ${w} 0 0 0 ${c}`);
    }
    if (col === bounds.maxCol) {
        parts.push(`inset calc(-1 * ${w}) 0 0 0 ${c}`);
    }
    return parts.join(", ");
}

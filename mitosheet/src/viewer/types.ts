/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Metadata for each column in the DataFrame (name levels + pandas dtype).
 */
export interface ColumnMetadata {
    /** Display name (for MultiIndex, array of level names) */
    name: string[];
    /** Pandas dtype (e.g. 'int64', 'object') */
    dtype: string;
}

/**
 * Payload from Python to the React DataFrame viewer.
 */
export interface ViewerPayload {
    columns: ColumnMetadata[];
    /** JSON-serialized 2D array of cell values (strings) */
    data: string;
    totalRows: number;
    indexLevels?: number;
    columnLevels?: number;
}

export interface MitoViewerProps {
    payload: ViewerPayload;
}

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
    columnIndex: number | null;
    direction: SortDirection;
}

/** Cell position in the current (filtered/sorted) table view */
export interface CellPos {
    row: number;
    col: number;
}

/** Normalized rectangle for range checks and edge styling */
export interface SelectionBounds {
    minRow: number;
    maxRow: number;
    minCol: number;
    maxCol: number;
}

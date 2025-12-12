import { useState, useCallback, useEffect, RefObject } from "react";
import { measureTextWidth, getFontStyle, getMonospaceFontStyle } from "./measureTextWidth";
import type { ColumnMetadata } from "./MitoViewer";

/**
 * Interface defining the resizing state during an active resize operation.
 */
interface ResizingState {
    /** Index of the column being resized */
    columnIndex: number;
    /** Initial mouse X position when resize started */
    startX: number;
    /** Column width when resize started */
    startWidth: number;
}

/**
 * Configuration options for column resizing.
 */
interface ColumnResizeOptions {
    /** Default width for columns in pixels (default: 200) */
    defaultWidth?: number;
    /** Minimum width for columns in pixels (default: 50) */
    minWidth?: number;
    /** Column metadata for calculating auto-resize widths */
    columns?: ColumnMetadata[];
    /** Data rows for calculating auto-resize widths */
    data?: any[][];
    /** Number of index levels (for MultiIndex support) */
    indexLevels?: number;
    /** Number of column levels (for MultiIndex support) */
    columnLevels?: number;
    /** Reference to the table container element for font measurement */
    tableContainerRef?: RefObject<HTMLElement>;
}

/**
 * Return type for the useColumnResize hook.
 */
interface UseColumnResizeReturn {
    /** Current column widths mapped by column index */
    columnWidths: Record<number, number>;
    /** Whether a column is currently being resized */
    isResizing: boolean;
    /** Handler to start resizing a column */
    handleResizeStart: (columnIndex: number, startX: number) => void;
    /** Get the width for a specific column */
    getColumnWidth: (columnIndex: number) => number;
    /** Auto-resize a column to fit its content */
    autoResizeColumn: (columnIndex: number, contentWidth: number) => void;
    /** Calculate and auto-resize a column to fit its content */
    calculateAndAutoResizeColumn: (columnIndex: number) => void;
}

/**
 * Custom hook for managing column resizing functionality in tables.
 * Handles state management and event listeners for drag-to-resize column widths.
 *
 * @param options - Configuration options for column resizing
 * @returns Object containing column widths, resize state, and handler functions
 */
export const useColumnResize = (
    options: ColumnResizeOptions = {}
): UseColumnResizeReturn => {
    const {
        defaultWidth = 200,
        minWidth = 50,
        columns = [],
        data = [],
        indexLevels = 1,
        columnLevels = 1,
        tableContainerRef,
    } = options;

    // State for column widths - tracks custom widths for each column
    const [columnWidths, setColumnWidths] = useState<Record<number, number>>({});
    // State for resizing - tracks which column is being resized and the starting position
    const [resizing, setResizing] = useState<ResizingState | null>(null);

    /**
     * Handles the start of column resizing.
     * Records the initial mouse position and current column width.
     *
     * @param columnIndex - Index of the column being resized
     * @param startX - Initial mouse X position
     */
    const handleResizeStart = useCallback(
        (columnIndex: number, startX: number) => {
            const currentWidth = columnWidths[columnIndex] || defaultWidth;
            setResizing({
                columnIndex,
                startX,
                startWidth: currentWidth,
            });
        },
        [columnWidths, defaultWidth]
    );

    /**
     * Handles mouse move during column resizing.
     * Updates the column width based on mouse movement.
     */
    const handleResizeMove = useCallback(
        (e: MouseEvent) => {
            if (!resizing) return;

            const diff = e.clientX - resizing.startX;
            const newWidth = Math.max(minWidth, resizing.startWidth + diff);

            setColumnWidths((prev) => ({
                ...prev,
                [resizing.columnIndex]: newWidth,
            }));
        },
        [resizing, minWidth]
    );

    /**
     * Handles the end of column resizing.
     * Cleans up event listeners.
     */
    const handleResizeEnd = useCallback(() => {
        setResizing(null);
    }, []);

    // Set up global mouse event listeners for resizing
    useEffect(() => {
        if (resizing) {
            document.addEventListener("mousemove", handleResizeMove);
            document.addEventListener("mouseup", handleResizeEnd);
            return () => {
                document.removeEventListener("mousemove", handleResizeMove);
                document.removeEventListener("mouseup", handleResizeEnd);
            };
        }
    }, [resizing, handleResizeMove, handleResizeEnd]);

    /**
     * Gets the width for a specific column.
     * Returns custom width if set, otherwise returns default width.
     *
     * @param columnIndex - Index of the column
     * @returns Width in pixels
     */
    const getColumnWidth = useCallback(
        (columnIndex: number): number => {
            return columnWidths[columnIndex] || defaultWidth;
        },
        [columnWidths, defaultWidth]
    );

    /**
     * Auto-resizes a column to fit its content.
     * Sets the column width to the provided content width (with padding).
     *
     * @param columnIndex - Index of the column to resize
     * @param contentWidth - The calculated width needed for the content in pixels
     */
    const autoResizeColumn = useCallback(
        (columnIndex: number, contentWidth: number) => {
            // Add padding (12px on each side = 24px total) plus some extra buffer
            const padding = 24;
            const buffer = 10; // Extra buffer for better UX
            const newWidth = Math.max(minWidth, contentWidth + padding + buffer);

            setColumnWidths((prev) => ({
                ...prev,
                [columnIndex]: newWidth,
            }));
        },
        [minWidth]
    );

    /**
     * Calculates the maximum width needed for a column based on its content.
     * Measures header text (name + dtype) and all cell values.
     * Accounts for different fonts (monospace for numeric columns).
     *
     * @param columnIndex - Index of the column to measure
     * @returns Maximum width needed in pixels
     */
    const calculateColumnMaxWidth = useCallback(
        (columnIndex: number): number => {
            const fontElement = tableContainerRef?.current;
            const baseFont = getFontStyle(fontElement);
            const numericFont = getMonospaceFontStyle(fontElement);

            // Numeric columns use monospace font
            const isNumeric =
                columns[columnIndex]?.dtype.includes("int") ||
                columns[columnIndex]?.dtype.includes("float");

            let maxWidth = 0;

            // Measure header content (always uses base font)
            if (columnIndex < columns.length) {
                const column = columns[columnIndex];
                const headerName =
                    column.name[columnIndex < indexLevels ? 0 : columnLevels - 1];
                const headerText = `${headerName} (${column.dtype})`;
                maxWidth = Math.max(maxWidth, measureTextWidth(headerText, baseFont));

                // Add space for sort icon (approximately 20px)
                maxWidth += 20;
            }

            // Measure cell values in this column
            // For very large datasets, sample rows to maintain performance
            // We measure: first row, last row, and evenly spaced rows in between
            const MAX_ROWS_TO_MEASURE = 200; // Limit measurements for performance
            const rowsToMeasure = data.length <= MAX_ROWS_TO_MEASURE
                ? data
                : (() => {
                    // Sample strategy: first, last, and evenly spaced middle rows
                    const sampled: any[][] = [];
                    sampled.push(data[0]); // First row
                    
                    if (data.length > 2) {
                        const step = Math.ceil((data.length - 2) / (MAX_ROWS_TO_MEASURE - 2));
                        for (let i = 1; i < data.length - 1; i += step) {
                            sampled.push(data[i]);
                        }
                    }
                    
                    if (data.length > 1) {
                        sampled.push(data[data.length - 1]); // Last row
                    }
                    
                    return sampled;
                })();

            // Use for loop instead of forEach for better performance
            const cellFont = isNumeric ? numericFont : baseFont;
            for (let i = 0; i < rowsToMeasure.length; i++) {
                const row = rowsToMeasure[i];
                if (columnIndex < row.length) {
                    const cellText = String(row[columnIndex] || "");
                    const cellWidth = measureTextWidth(cellText, cellFont);
                    if (cellWidth > maxWidth) {
                        maxWidth = cellWidth;
                    }
                }
            }

            return maxWidth;
        },
        [columns, data, indexLevels, columnLevels, tableContainerRef]
    );

    /**
     * Calculates and auto-resizes a column to fit its content.
     * This is the main function to call for Excel-like double-click auto-resize.
     *
     * @param columnIndex - Index of the column to auto-resize
     */
    const calculateAndAutoResizeColumn = useCallback(
        (columnIndex: number) => {
            const maxWidth = calculateColumnMaxWidth(columnIndex);
            autoResizeColumn(columnIndex, maxWidth);
        },
        [calculateColumnMaxWidth, autoResizeColumn]
    );

    return {
        columnWidths,
        isResizing: resizing !== null,
        handleResizeStart,
        getColumnWidth,
        autoResizeColumn,
        calculateAndAutoResizeColumn,
    };
};


import React, { useState, useMemo, useCallback, useRef } from "react";
import "./../../css/viewer.css";
import { useColumnResize } from "./useColumnResize";
import {
    calculateMaxDecimalPlaces,
    parseNumericValue,
    formatCellValue,
} from "./numericFormatting";

/**
 * Interface defining metadata for each column in the DataFrame.
 * Contains the column name and its pandas data type.
 */
export interface ColumnMetadata {
    /** The display name of the column as it appears in the DataFrame
   * (for MultiIndex, this is an array of level names)
   */
    name: string[];
    /** The pandas data type of the column (e.g., 'int64', 'float64', 'object', 'datetime64[ns]') */
    dtype: string;
}

/**
 * Interface defining the complete data payload passed from Python to the React component.
 * Contains all necessary information to render the DataFrame viewer including column metadata,
 * row data, and truncation information.
 */
export interface ViewerPayload {
    /** Array of column metadata containing name and dtype information */
    columns: ColumnMetadata[];
    /** JSON serialized 2D array of values representing the DataFrame data. All values are converted to strings for consistent display. */
    data: string;
    /** Total number of rows in the original DataFrame before truncation */
    totalRows: number;
    /** Number of index levels if MultiIndex */
    indexLevels?: number;
    /** Number of column levels if MultiIndex */
    columnLevels?: number;
}

/**
 * Props interface for the MitoViewer React component.
 * Contains the data payload needed to render the interactive DataFrame viewer.
 */
export interface MitoViewerProps {
    /** The complete payload containing DataFrame data and metadata */
    payload: ViewerPayload;
}

/**
 * Type defining the possible sorting directions for table columns.
 * - 'asc': Sort in ascending order
 * - 'desc': Sort in descending order
 * - null: No sorting applied
 */
type SortDirection = "asc" | "desc" | null;

/**
 * Interface defining the current sorting state of the table.
 * Tracks which column is currently being sorted and in which direction.
 */
interface SortState {
    /** Index of the column being sorted, or null if no column is sorted */
    columnIndex: number | null;
    /** Current sorting direction for the active column */
    direction: SortDirection;
}

export const MitoViewer: React.FC<MitoViewerProps> = ({ payload }) => {
    // State for search functionality - filters table rows based on user input
    const [searchTerm, setSearchTerm] = useState("");
    // State for sorting functionality - tracks which column and direction to sort
    const [sort, setSort] = useState<SortState>({
        columnIndex: null,
        direction: null,
    });
    // Ref to the table container for font measurement
    const tableContainerRef = useRef<HTMLDivElement>(null);

    const data = JSON.parse(payload.data) as any[][];
    const isTruncated = data.length < payload.totalRows;
    const indexLevels = payload.indexLevels ?? 1;
    const columnLevels = payload.columnLevels ?? 1;

    /**
   * Memoized function to calculate maximum decimal places for each numeric column.
   * This is used to align decimal points across all numbers in a column.
   */
    const maxDecimalPlaces = useMemo(
        () => calculateMaxDecimalPlaces(data, payload.columns),
        [data, payload.columns]
    );

    /**
   * Memoized function to filter data based on search term.
   * Returns all data if search term is empty, otherwise filters rows
   * where any cell contains the search term (case-insensitive).
   */
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return data;

        const lowerSearchTerm = searchTerm.toLowerCase();
        return data.filter((row) =>
            row.some((cell) => `${cell}`.toLowerCase().includes(lowerSearchTerm))
        );
    }, [data, searchTerm]);

    /**
   * Memoized function to sort filtered data based on current sort state.
   * Attempts numeric sorting first, falls back to string comparison.
   * Returns unsorted data if no column is actively being sorted.
   */
    const sortedData = useMemo(() => {
        if (sort.columnIndex === null || sort.direction === null)
            return filteredData;

        return [...filteredData].sort((a, b) => {
            const aValue = a[sort.columnIndex!];
            const bValue = b[sort.columnIndex!];

            // Try to parse as numbers for numeric sorting
            const aNum = parseFloat(aValue);
            const bNum = parseFloat(bValue);
            const aIsNumeric = !isNaN(aNum) && aValue != null;
            const bIsNumeric = !isNaN(bNum) && bValue != null;

            // If both are numeric, compare numerically
            if (aIsNumeric && bIsNumeric) {
                return sort.direction === "asc" ? aNum - bNum : bNum - aNum;
            }

            // Handle null/undefined values
            // Ascending: nulls go to top (treated as smallest: None, 2, 123)
            // Descending: nulls go to bottom (treated as largest: 123, 2, None)
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) {
                return sort.direction === "asc" ? -1 : 1;
            }
            if (bValue == null) {
                return sort.direction === "asc" ? 1 : -1;
            }

            // If one is numeric and the other isn't, numeric comes first
            if (aIsNumeric && !bIsNumeric) {
                return sort.direction === "asc" ? -1 : 1;
            }
            if (!aIsNumeric && bIsNumeric) {
                return sort.direction === "asc" ? 1 : -1;
            }

            // String comparison for non-numeric, non-null values
            // Ensure both values are strings before calling localeCompare
            const comparison = String(aValue).localeCompare(String(bValue));
            return sort.direction === "asc" ? comparison : -comparison;
        });
    }, [filteredData, sort]);

    // Column resizing functionality - must be after sortedData is defined
    const {
        isResizing,
        handleResizeStart,
        getColumnWidth,
        calculateAndAutoResizeColumn,
    } = useColumnResize({
        columns: payload.columns,
        data: sortedData,
        indexLevels,
        columnLevels,
        tableContainerRef,
    });

    /**
   * Helper to render a full header cell with sort/resize functionality
   */
    const renderHeaderCell = (
        index: number,
        name: string,
        rowSpan?: number
    ) => (
        <th
            key={index}
            className="mito-viewer__header-cell"
            title={`${name} (${payload.columns[index].dtype})`}
            rowSpan={rowSpan}
            style={{
                width: getColumnWidth(index),
                minWidth: getColumnWidth(index),
            }}
        >
            <span>{name}</span>
            <span
                className="mito-viewer__sort-icon-container"
                onClick={(e) => {
                    e.stopPropagation();
                    handleSort(index);
                }}
            >
                {getSortIcon(index)}
            </span>
            <div className="mito-viewer__column-dtype">
                {payload.columns[index].dtype}
            </div>
            <div
                className="mito-viewer__resize-handle"
                onMouseDown={(e) => {
                    e.stopPropagation();
                    handleResizeStart(index, e.clientX);
                }}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleResizeHandleDoubleClick(index, e);
                }}
            />
        </th>
    );

    /**
   * Renders table header row with proper MultiIndex support.
   */
    const renderTableHeader = () => {
        return (
            <thead>
                {Array.from({ length: columnLevels }).map((_, levelIndex) => {
                    const isFinalLevel = levelIndex === columnLevels - 1;

                    return (
                        <tr
                            className="mito-viewer__header-row"
                            key={`column-level-${levelIndex}`}
                        >
                            {payload.columns.map((column, index) => {
                                // Index columns: render only on first level with rowSpan
                                if (index < indexLevels) {
                                    return levelIndex === 0
                                        ? renderHeaderCell(
                                            index,
                                            column.name[0],
                                            columnLevels
                                        )
                                        : null;
                                }

                                // For MultiIndex: skip if previous column matches all levels up to this one
                                if (columnLevels > 1 && index > indexLevels) {
                                    const prev = payload.columns[index - 1];
                                    if (
                                        prev.name
                                            .slice(0, levelIndex + 1)
                                            .every((val, l) => val === column.name[l])
                                    ) {
                                        return null;
                                    }
                                }

                                // Calculate colspan: count consecutive columns with matching values up to this level
                                let colSpan = 1;
                                if (columnLevels > 1) {
                                    for (
                                        let i = index + 1;
                                        i < payload.columns.length;
                                        i++
                                    ) {
                                        const next = payload.columns[i];
                                        if (
                                            next.name
                                                .slice(0, levelIndex + 1)
                                                .every((val, l) => val === column.name[l])
                                        ) {
                                            colSpan++;
                                        } else {
                                            break;
                                        }
                                    }
                                }

                                // Render cell
                                if (isFinalLevel || columnLevels === 1) {
                                    return renderHeaderCell(
                                        index,
                                        column.name[isFinalLevel ? levelIndex : 0]
                                    );
                                }
                                return (
                                    <th
                                        key={index}
                                        className="mito-viewer__header-cell-multiindex"
                                        colSpan={colSpan}
                                    >
                                        {column.name[levelIndex]}
                                    </th>
                                );
                            })}
                        </tr>
                    );
                })}
            </thead>
        );
    };


    /**
   * Renders table body with proper MultiIndex support.
   * Handles rowspan for MultiIndex columns.
   */
    const renderTableBody = () => {
        const isNumeric = payload.columns.map(
            (col) => col.dtype.includes("int") || col.dtype.includes("float")
        );
        const rowSpan = new Array(indexLevels).fill(0);
        return (
            <tbody>
                {sortedData.map((row: any[], rowIndex: number) => {
                    return (
                        <tr
                            key={rowIndex}
                            className={
                                rowIndex % 2 === 0
                                    ? "mito-viewer__body-row mito-viewer__body-row-even"
                                    : "mito-viewer__body-row mito-viewer__body-row-odd"
                            }
                        >
                            {row.map((cell: any, cellIndex: number) => {
                                let cellRowSpan: number | undefined = undefined;
                                if (indexLevels > 1 && cellIndex < indexLevels) {
                                    if (
                                        rowSpan[cellIndex] == 0 &&
                                        rowSpan.slice(0, cellIndex).every((rs) => rs > 0)
                                    ) {
                                        // Count how many subsequent rows have the same value for this index level
                                        let spanCount = 1;
                                        for (
                                            let nextRow = rowIndex + 1;
                                            nextRow < sortedData.length;
                                            nextRow++
                                        ) {
                                            // Use strict equality to handle booleans correctly
                                            if (sortedData[nextRow][cellIndex] === cell) {
                                                spanCount++;
                                            } else {
                                                break;
                                            }
                                        }
                                        cellRowSpan = spanCount;
                                        rowSpan[cellIndex] = spanCount;
                                    }

                                    const skip = rowSpan[cellIndex] > 0 && !cellRowSpan;
                                    rowSpan[cellIndex]--;
                                    if (skip) {
                                        return null;
                                    }
                                }
                                const formattedCell = formatCellValue(cell);
                                const numericParts = parseNumericValue(
                                    cell,
                                    cellIndex,
                                    payload.columns
                                );
                                let className = `mito-viewer__body-cell mito-viewer__body-cell-${isNumeric[cellIndex] ? "numeric" : "text"
                                    }`;
                                if (cellIndex < indexLevels) {
                                    className += " mito-viewer__body-cell-index";
                                }

                                // For numeric columns that have any decimals, render all numbers with aligned structure
                                const maxDecimals = cellIndex < maxDecimalPlaces.length
                                    ? maxDecimalPlaces[cellIndex]
                                    : 0;
                                const decimalPartWidth = maxDecimals > 0 ? `${maxDecimals}ch` : '0ch';

                                /* 
                                If this is a numeric column with decimals in the column, use aligned structure
                                We do this because its hard to quickly scan numbers in a column if they have
                                various number of decimal places. It makes 1.234 seem larger than 60 because it 
                                ends up being further to the left. The simple solution is to pad all numbers with 0
                                to have the same number of decimal places, but we don't want to change the view of the 
                                data that we display. Any difference between the underlying data and the displayed data
                                is very confusing to the user.
                                */
                                const shouldUseAlignedStructure = numericParts && maxDecimals > 0;

                                const cellContent = shouldUseAlignedStructure ? (
                                    <span className="mito-viewer__numeric-aligned">
                                        <span className="mito-viewer__numeric-integer">
                                            {numericParts.integerPart}
                                        </span>
                                        {numericParts.hasDecimal && (
                                            <>
                                                <span className="mito-viewer__numeric-decimal-separator">.</span>
                                                <span
                                                    className="mito-viewer__numeric-decimal"
                                                    style={{ minWidth: decimalPartWidth }}
                                                >
                                                    {numericParts.decimalPart}
                                                </span>
                                            </>
                                        )}
                                        {!numericParts.hasDecimal && (
                                            <>
                                                <span className="mito-viewer__numeric-decimal-separator" style={{ visibility: 'hidden' }}>.</span>
                                                <span
                                                    className="mito-viewer__numeric-decimal"
                                                    style={{ minWidth: decimalPartWidth }}
                                                >
                                                </span>
                                            </>
                                        )}
                                    </span>
                                ) : (
                                    formattedCell
                                );

                                return (
                                    <td
                                        key={cellIndex}
                                        className={className}
                                        title={formattedCell}
                                        rowSpan={cellRowSpan}
                                        style={{
                                            width: getColumnWidth(cellIndex),
                                            minWidth: getColumnWidth(cellIndex),
                                        }}
                                    >
                                        {cellContent}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
        );
    };

    /**
   * Handles column header clicks to toggle sorting.
   * Cycles through: unsorted -> ascending -> descending -> unsorted
   *
   * @param columnIndex - Index of the column to sort
   */
    const handleSort = useCallback((columnIndex: number) => {
        setSort((prevSort) => {
            if (prevSort.columnIndex === columnIndex) {
                // Toggle direction or reset if already descending
                if (prevSort.direction === "asc") {
                    return { columnIndex, direction: "desc" };
                } else if (prevSort.direction === "desc") {
                    return { columnIndex: null, direction: null };
                }
            }
            return { columnIndex, direction: "asc" };
        });
    }, []);

    /**
   * Returns the appropriate sort icon for a column based on current sort state.
   * Shows directional arrows for active sorts, dimmed icon for inactive columns.
   *
   * @param columnIndex - Index of the column to get icon for
   * @returns React element containing the sort icon or null
   */
    const getSortIcon = useCallback(
        (columnIndex: number) => {
            if (sort.columnIndex !== columnIndex) {
                return (
                    <span className="mito-viewer__sort-icon mito-viewer__sort-icon-inactive">
                        ⇅
                    </span>
                );
            }

            if (sort.direction === "asc") {
                return <span className="mito-viewer__sort-icon active">↑</span>;
            } else if (sort.direction === "desc") {
                return <span className="mito-viewer__sort-icon active">↓</span>;
            }

            return null;
        },
        [sort]
    );

    /**
   * Handles double-click on resize handle to auto-resize column.
   * Calculates the maximum width needed and applies it.
   *
   * @param columnIndex - Index of the column to auto-resize
   * @param e - Mouse event
   */
    const handleResizeHandleDoubleClick = useCallback(
        (columnIndex: number, e: React.MouseEvent) => {
            e.stopPropagation();
            calculateAndAutoResizeColumn(columnIndex);
        },
        [calculateAndAutoResizeColumn]
    );


    return (
        <div className="mito-viewer">
            {/* Controls */}
            <div className="mito-viewer__controls">
                <div className={`mito-viewer__row-info ${isTruncated ? 'mito-viewer__row-info--warning' : ''}`}>
                    {isTruncated ? (
                        <>
                            ⚠ Table truncated to first {data.length} / {payload.totalRows} rows. Set pandas display.max_rows to configure total rows.
                        </>
                    ) : (
                        `Total Rows: ${payload.totalRows}`
                    )}
                </div>

                <div className="mito-viewer__search-container">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mito-viewer__search-input"
                    />
                </div>
            </div>

            {/* Table */}
            <div
                ref={tableContainerRef}
                className={`mito-viewer__table-container ${isResizing ? 'mito-viewer__table-container--resizing' : ''}`}
            >
                <table className="mito-viewer__table">
                    {renderTableHeader()}
                    {renderTableBody()}
                </table>
            </div>

            {/* Footer info */}
            {sortedData.length === 0 && (
                <div className="mito-viewer__empty-state">
                    No rows match the search criteria
                </div>
            )}
        </div>
    );
};

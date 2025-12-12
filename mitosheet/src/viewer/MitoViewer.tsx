import React, { useState, useMemo, useCallback } from "react";
import "./../../css/viewer.css";

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

    const data = JSON.parse(payload.data) as any[][];
    const isTruncated = data.length < payload.totalRows;
    const indexLevels = payload.indexLevels ?? 1;
    const columnLevels = payload.columnLevels ?? 1;

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

            if (!isNaN(aNum) && !isNaN(bNum)) {
                return sort.direction === "asc" ? aNum - bNum : bNum - aNum;
            }

            // String comparison for non-numeric values
            const comparison = (aValue ?? "").localeCompare(bValue ?? "");
            return sort.direction === "asc" ? comparison : -comparison;
        });
    }, [filteredData, sort]);

    /**
   * Renders table header row with proper MultiIndex support.
   * Handles rowspan for MultiIndex columns.
   */
    const renderTableHeader = () => {
        let colSpan = 0;
        let skipColumns = 0;
        return (
            <thead>
                {Array.from({ length: columnLevels }).map((_, levelIndex) => (
                    <tr
                        className="mito-viewer__header-row"
                        key={`column-level-${levelIndex}`}
                    >
                        {payload.columns.map((column, index) => {
                            if (columnLevels > 1 && index >= indexLevels && skipColumns < 0) {
                                skipColumns = 1;
                                // Calculate colspan for MultiIndex columns
                                colSpan = 1;
                                for (
                                    let nextIndex = index + 1;
                                    nextIndex < payload.columns.length;
                                    nextIndex++
                                ) {
                                    const nextColumn = payload.columns[nextIndex];
                                    let allMatch = true;
                                    for (let l = 0; l <= levelIndex; l++) {
                                        if (nextColumn.name[l] !== column.name[l]) {
                                            allMatch = false;
                                            break;
                                        }
                                    }
                                    if (allMatch) {
                                        colSpan++;
                                    } else {
                                        break;
                                    }
                                }
                                if (colSpan > 1) {
                                    skipColumns = colSpan - 1;
                                }
                            }
                            return levelIndex == columnLevels - 1 ? (
                                <th
                                    key={index}
                                    onClick={() => handleSort(index)}
                                    className={"mito-viewer__header-cell"}
                                    title={`${
                                        column.name[index < indexLevels ? 0 : levelIndex]
                                    } (${column.dtype})`}
                                >
                                    <span>
                                        {column.name[index < indexLevels ? 0 : levelIndex]}
                                    </span>
                                    {getSortIcon(index)}
                                    <div className="mito-viewer__column-dtype">
                                        {column.dtype}
                                    </div>
                                </th>
                            ) : skipColumns-- > 0 ? null : (
                                <th
                                    key={index}
                                    className={
                                        index >= indexLevels
                                            ? "mito-viewer__header-cell-multiindex"
                                            : "mito-viewer__header-cell"
                                    }
                                    colSpan={colSpan}
                                >
                                    {index >= indexLevels && column.name[levelIndex]}
                                </th>
                            );
                        })}
                    </tr>
                ))}
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
                {sortedData.map((row: string[], rowIndex: number) => {
                    return (
                        <tr
                            key={rowIndex}
                            className={
                                rowIndex % 2 === 0
                                    ? "mito-viewer__body-row mito-viewer__body-row-even"
                                    : "mito-viewer__body-row mito-viewer__body-row-odd"
                            }
                        >
                            {row.map((cell: string, cellIndex: number) => {
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
                                let className = `mito-viewer__body-cell mito-viewer__body-cell-${
                                    isNumeric[cellIndex] ? "numeric" : "text"
                                }`;
                                if (cellIndex < indexLevels) {
                                    className += " mito-viewer__body-cell-index";
                                }
                                return (
                                    <td
                                        key={cellIndex}
                                        className={className}
                                        title={cell}
                                        rowSpan={cellRowSpan}
                                    >
                                        {cell}
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
                return <span className="mito-viewer__sort-icon">↑</span>;
            } else if (sort.direction === "desc") {
                return <span className="mito-viewer__sort-icon">↓</span>;
            }

            return null;
        },
        [sort]
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
            <div className="mito-viewer__table-container">
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

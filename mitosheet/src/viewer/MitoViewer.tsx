import React, { useState, useMemo } from "react";
import "./../../css/viewer.css";

/**
 * Interface defining metadata for each column in the DataFrame.
 * Contains the column name and its pandas data type.
 */
interface ColumnMetadata {
    /** The display name of the column as it appears in the DataFrame */
    name: string;
    /** The pandas data type of the column (e.g., 'int64', 'float64', 'object', 'datetime64[ns]') */
    dtype: string;
}

/**
 * Interface defining the complete data payload passed from Python to the React component.
 * Contains all necessary information to render the DataFrame viewer including column metadata,
 * row data, and truncation information.
 */
interface ViewerPayload {
    /** Array of column metadata containing name and dtype information */
    columns: ColumnMetadata[];
    /** 2D array of string values representing the DataFrame data. All values are converted to strings for consistent display. */
    data: string[][];
    /** Flag indicating whether the DataFrame was truncated due to pandas display.max_rows setting */
    isTruncated: boolean;
    /** Total number of rows in the original DataFrame before truncation */
    totalRows: number;
    /** Number of rows actually being displayed (may be less than totalRows if truncated) */
    displayRows: number;
    /** Flag indicating whether the DataFrame has a MultiIndex */
    isMultiIndex?: boolean;
    /** Number of index levels if MultiIndex */
    indexLevels?: number;
}

/**
 * Props interface for the MitoViewer React component.
 * Contains the data payload needed to render the interactive DataFrame viewer.
 */
interface MitoViewerProps {
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

const MitoViewer: React.FC<MitoViewerProps> = ({ payload }) => {
    // State for search functionality - filters table rows based on user input
    const [searchTerm, setSearchTerm] = useState("");
    // State for sorting functionality - tracks which column and direction to sort
    const [sort, setSort] = useState<SortState>({
        columnIndex: null,
        direction: null,
    });

    // Generate truncation message if needed
    const truncationMessage = payload.isTruncated
        ? `Table truncated to ${payload.displayRows} rows by pandas display.max_rows setting. Total rows: ${payload.totalRows}`
        : undefined;

    /**
   * Memoized function to filter data based on search term.
   * Returns all data if search term is empty, otherwise filters rows
   * where any cell contains the search term (case-insensitive).
   */
    const filteredData = useMemo(() => {
        if (!searchTerm.trim()) return payload.data;

        const lowerSearchTerm = searchTerm.toLowerCase();
        return payload.data.filter((row) =>
            row.some((cell) => cell.toLowerCase().includes(lowerSearchTerm))
        );
    }, [payload.data, searchTerm]);

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
            const comparison = aValue.localeCompare(bValue);
            return sort.direction === "asc" ? comparison : -comparison;
        });
    }, [filteredData, sort]);

    /**
   * Renders table header row with proper MultiIndex support.
   * Handles rowspan for MultiIndex columns.
   */
    const renderTableHeader = () => {
        const indexLevels = payload.indexLevels ?? 1;
        if (payload.isMultiIndex && indexLevels > 1) {
            // MultiIndex header - render index columns with rowspan
            const indexColumns = payload.columns.slice(0, indexLevels);
            const dataColumns = payload.columns.slice(indexLevels);
            return (
                <thead>
                    <tr className="mito-viewer__header-row">
                        {/* Index columns with rowspan */}
                        {indexColumns.map((column, index) => (
                            <th
                                key={index}
                                onClick={() => handleSort(index)}
                                className="mito-viewer__header-cell"
                                title={`${column.name} (${column.dtype})`}
                            >
                                <span>{column.name}</span>
                                {getSortIcon(index)}
                                <div className="mito-viewer__column-dtype">{column.dtype}</div>
                            </th>
                        ))}

                        {/* Data columns */}
                        {dataColumns.map((column, index) => {
                            const columnIndex = payload.indexLevels! + index;
                            return (
                                <th
                                    key={columnIndex}
                                    onClick={() => handleSort(columnIndex)}
                                    className="mito-viewer__header-cell"
                                    title={`${column.name} (${column.dtype})`}
                                >
                                    <span>{column.name}</span>
                                    {getSortIcon(columnIndex)}
                                    <div className="mito-viewer__column-dtype">
                                        {column.dtype}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
            );
        } else {
            // Single index header - original implementation
            return (
                <thead>
                    <tr className="mito-viewer__header-row">
                        {payload.columns.map((column, index) => (
                            <th
                                key={index}
                                onClick={() => handleSort(index)}
                                className={
                                    index < payload.columns.length - 1
                                        ? "mito-viewer__header-cell"
                                        : "mito-viewer__header-cell mito-viewer__header-cell--last"
                                }
                                title={`${column.name} (${column.dtype})`}
                            >
                                <span>{column.name}</span>
                                {getSortIcon(index)}
                                <div className="mito-viewer__column-dtype">{column.dtype}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
            );
        }
    };

    /**
   * Renders table body with proper MultiIndex support.
   * Handles rowspan for MultiIndex columns.
   */
    const renderTableBody = () => {
        const indexLevels = payload.indexLevels ?? 1;
        if (payload.isMultiIndex && indexLevels > 1) {
            // Group rows by MultiIndex values for proper rowspan rendering
            const groupedRows: Array<{
                indexValues: string[];
                dataRows: string[][];
                rowCount: number;
            }> = [];

            let currentGroup: typeof groupedRows[0] | null = null;

            for (const row of sortedData) {
                const indexValues = row.slice(0, indexLevels);
                const dataValues = row.slice(indexLevels);

                if (
                    currentGroup === null ||
          JSON.stringify(currentGroup.indexValues) ===
            JSON.stringify(indexValues)
                ) {
                    // Start new group
                    currentGroup = {
                        indexValues,
                        dataRows: [dataValues],
                        rowCount: 1,
                    };
                    groupedRows.push(currentGroup);
                } else {
                    // Add to existing group
                    currentGroup.dataRows.push(dataValues);
                    currentGroup.rowCount++;
                }
            }

            return (
                <tbody>
                    {groupedRows.map((group, groupIndex) => (
                        <React.Fragment key={groupIndex}>
                            {/* Header row for this group */}
                            <tr className="mito-viewer__group-header-row">
                                {group.indexValues.map((indexValue, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={
                                            cellIndex < group.indexValues.length - 1
                                                ? "mito-viewer__index-cell"
                                                : "mito-viewer__index-cell mito-viewer__index-cell--last"
                                        }
                                        title={indexValue}
                                    >
                                        {indexValue}
                                    </td>
                                ))}
                                {/* Empty cells for data columns in header row */}
                                {payload.columns.slice(indexLevels).map((_, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className={
                                            cellIndex <
                      payload.columns.length - indexLevels - 1
                                                ? "mito-viewer__empty-cell"
                                                : "mito-viewer__empty-cell mito-viewer__empty-cell--last"
                                        }
                                    />
                                ))}
                            </tr>

                            {/* Data rows for this group */}
                            {group.dataRows.map((dataRow, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    className={
                                        rowIndex % 2 === 0
                                            ? "mito-viewer__body-row mito-viewer__body-row--even"
                                            : "mito-viewer__body-row mito-viewer__body-row--odd"
                                    }
                                >
                                    {/* Empty cells for index columns */}
                                    {payload.columns.slice(0, indexLevels).map((_, cellIndex) => (
                                        <td
                                            key={cellIndex}
                                            className={
                                                cellIndex < payload.indexLevels! - 1
                                                    ? "mito-viewer__empty-cell"
                                                    : "mito-viewer__empty-cell mito-viewer__empty-cell--last"
                                            }
                                        />
                                    ))}

                                    {/* Data cells */}
                                    {dataRow.map((cell, cellIndex) => {
                                        const columnIndex = indexLevels + cellIndex;
                                        const isNumeric =
                      payload.columns[columnIndex].dtype.includes("int") ||
                      payload.columns[columnIndex].dtype.includes("float");
                                        return (
                                            <td
                                                key={cellIndex}
                                                className={
                                                    (columnIndex < payload.columns.length - 1
                                                        ? "mito-viewer__body-cell"
                                                        : "mito-viewer__body-cell mito-viewer__body-cell--last") +
                          " " +
                          (isNumeric
                              ? "mito-viewer__body-cell--numeric"
                              : "mito-viewer__body-cell--text")
                                                }
                                                title={cell}
                                            >
                                                {cell}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </React.Fragment>
                    ))}
                </tbody>
            );
        } else {
            // Single index body - original implementation
            return (
                <tbody>
                    {sortedData.map((row: string[], rowIndex: number) => (
                        <tr
                            key={rowIndex}
                            className={
                                rowIndex % 2 === 0
                                    ? "mito-viewer__body-row mito-viewer__body-row--even"
                                    : "mito-viewer__body-row mito-viewer__body-row--odd"
                            }
                        >
                            {row.map((cell: string, cellIndex: number) => {
                                const isNumeric =
                  payload.columns[cellIndex].dtype.includes("int") ||
                  payload.columns[cellIndex].dtype.includes("float");
                                return (
                                    <td
                                        key={cellIndex}
                                        className={
                                            (cellIndex < row.length - 1
                                                ? "mito-viewer__body-cell"
                                                : "mito-viewer__body-cell mito-viewer__body-cell--last") +
                      " " +
                      (isNumeric
                          ? "mito-viewer__body-cell--numeric"
                          : "mito-viewer__body-cell--text")
                                        }
                                        title={cell}
                                    >
                                        {cell}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            );
        }
    };

    /**
   * Handles column header clicks to toggle sorting.
   * Cycles through: unsorted -> ascending -> descending -> unsorted
   *
   * @param columnIndex - Index of the column to sort
   */
    const handleSort = (columnIndex: number) => {
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
    };

    /**
   * Returns the appropriate sort icon for a column based on current sort state.
   * Shows directional arrows for active sorts, dimmed icon for inactive columns.
   *
   * @param columnIndex - Index of the column to get icon for
   * @returns React element containing the sort icon or null
   */
    const getSortIcon = (columnIndex: number) => {
        if (sort.columnIndex !== columnIndex) {
            return (
                <span className="mito-viewer__sort-icon mito-viewer__sort-icon--inactive">
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
    };

    return (
        <div className="mito-viewer">
            {/* Warning message if truncated */}
            {payload.isTruncated && truncationMessage && (
                <div className="mito-viewer__warning">{truncationMessage}</div>
            )}

            {/* Controls */}
            <div className="mito-viewer__controls">
                <div className="mito-viewer__row-info">
                    {sortedData.length} of {payload.totalRows} rows
                    {payload.isTruncated && ` (showing ${payload.displayRows})`}
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

export default MitoViewer;

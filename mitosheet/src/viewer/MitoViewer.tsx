import React, { useState, useMemo, useEffect } from 'react';

/**
 * Interface defining the metadata for each column in the DataFrame.
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
  /** Optional warning message displayed when the DataFrame is truncated */
  truncationMessage?: string;
  /** Total number of rows in the original DataFrame before truncation */
  totalRows: number;
  /** Number of rows actually being displayed (may be less than totalRows if truncated) */
  displayRows: number;
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
type SortDirection = 'asc' | 'desc' | null;

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
  const [searchTerm, setSearchTerm] = useState('');
  // State for sorting functionality - tracks which column and direction to sort
  const [sort, setSort] = useState<SortState>({ columnIndex: null, direction: null });

  /**
   * Memoized function to filter data based on search term.
   * Returns all data if search term is empty, otherwise filters rows
   * where any cell contains the search term (case-insensitive).
   */
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return payload.data;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return payload.data.filter(row =>
      row.some(cell => cell.toLowerCase().includes(lowerSearchTerm))
    );
  }, [payload.data, searchTerm]);

  /**
   * Memoized function to sort filtered data based on current sort state.
   * Attempts numeric sorting first, falls back to string comparison.
   * Returns unsorted data if no column is actively being sorted.
   */
  const sortedData = useMemo(() => {
    if (sort.columnIndex === null || sort.direction === null) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sort.columnIndex!];
      const bValue = b[sort.columnIndex!];
      
      // Try to parse as numbers for numeric sorting
      const aNum = parseFloat(aValue);
      const bNum = parseFloat(bValue);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sort.direction === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // String comparison for non-numeric values
      const comparison = aValue.localeCompare(bValue);
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sort]);

  /**
   * Handles column header clicks to toggle sorting.
   * Cycles through: unsorted -> ascending -> descending -> unsorted
   * 
   * @param columnIndex - Index of the column to sort
   */
  const handleSort = (columnIndex: number) => {
    setSort(prevSort => {
      if (prevSort.columnIndex === columnIndex) {
        // Toggle direction or reset if already descending
        if (prevSort.direction === 'asc') {
          return { columnIndex, direction: 'desc' };
        } else if (prevSort.direction === 'desc') {
          return { columnIndex: null, direction: null };
        }
      }
      return { columnIndex, direction: 'asc' };
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
        <span style={{ marginLeft: '4px', opacity: 0.3 }}>
          ⇅
        </span>
      );
    }
    
    if (sort.direction === 'asc') {
      return <span style={{ marginLeft: '4px' }}>↑</span>;
    } else if (sort.direction === 'desc') {
      return <span style={{ marginLeft: '4px' }}>↓</span>;
    }
    
    return null;
  };

  return (
    <div className="mito-viewer" style={{
      fontFamily: 'var(--jp-ui-font-family, system-ui, -apple-system, sans-serif)',
      fontSize: 'var(--jp-ui-font-size1, 13px)',
      color: 'var(--jp-ui-font-color1, black)',
      backgroundColor: 'var(--jp-layout-color0, white)',
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid var(--jp-border-color2, #e0e0e0)'
    }}>
      {/* Warning message if truncated */}
      {payload.isTruncated && payload.truncationMessage && (
        <div style={{
          backgroundColor: 'var(--jp-warn-color0, #fff3cd)',
          color: 'var(--jp-warn-color1, #856404)',
          padding: '8px 12px',
          borderRadius: '4px',
          marginBottom: '12px',
          border: `1px solid var(--jp-warn-color2, #ffeaa7)`,
          fontSize: 'var(--jp-ui-font-size0, 11px)'
        }}>
          {payload.truncationMessage}
        </div>
      )}

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        gap: '12px'
      }}>
        <div style={{
          fontSize: 'var(--jp-ui-font-size0, 11px)',
          color: 'var(--jp-ui-font-color2, #666)'
        }}>
          {sortedData.length} of {payload.totalRows} rows
          {payload.isTruncated && ` (showing ${payload.displayRows})`}
        </div>
        
        <div style={{
          position: 'relative',
          flex: '0 0 200px'
        }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '4px 8px',
              border: `1px solid var(--jp-border-color2, #e0e0e0)`,
              borderRadius: '4px',
              fontSize: 'var(--jp-ui-font-size1, 13px)',
              fontFamily: 'inherit',
              backgroundColor: 'var(--jp-input-background, white)',
              color: 'inherit'
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{
        overflow: 'auto',
        border: `1px solid var(--jp-border-color2, #e0e0e0)`,
        borderRadius: '4px'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 'inherit'
        }}>
          <thead>
            <tr style={{
              backgroundColor: 'var(--jp-layout-color2, #f5f5f5)',
              borderBottom: `2px solid var(--jp-border-color2, #e0e0e0)`
            }}>
              {payload.columns.map((column, index) => (
                <th
                  key={index}
                  onClick={() => handleSort(index)}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'left',
                    fontWeight: '600',
                    borderBottom: `1px solid var(--jp-border-color2, #e0e0e0)`,
                    borderRight: index < payload.columns.length - 1 ? `1px solid var(--jp-border-color1, #f0f0f0)` : 'none',
                    cursor: 'pointer',
                    userSelect: 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '200px'
                  }}
                  title={`${column.name} (${column.dtype})`}
                >
                  <span>{column.name}</span>
                  {getSortIcon(index)}
                  <div style={{
                    fontSize: 'var(--jp-ui-font-size0, 11px)',
                    fontWeight: 'normal',
                    color: 'var(--jp-ui-font-color2, #666)',
                    marginTop: '2px'
                  }}>
                    {column.dtype}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                style={{
                  backgroundColor: rowIndex % 2 === 0 
                    ? 'var(--jp-layout-color0, white)' 
                    : 'var(--jp-layout-color1, #f9f9f9)',
                  borderBottom: `1px solid var(--jp-border-color1, #f0f0f0)`
                }}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    style={{
                      padding: '6px 12px',
                      borderBottom: `1px solid var(--jp-border-color1, #f0f0f0)`,
                      borderRight: cellIndex < row.length - 1 ? `1px solid var(--jp-border-color1, #f0f0f0)` : 'none',
                      textAlign: payload.columns[cellIndex].dtype.includes('int') || payload.columns[cellIndex].dtype.includes('float') ? 'right' : 'left',
                      fontFamily: payload.columns[cellIndex].dtype.includes('int') || payload.columns[cellIndex].dtype.includes('float') ? 'var(--jp-code-font-family, monospace)' : 'inherit',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '200px'
                    }}
                    title={cell}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer info */}
      {sortedData.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: 'var(--jp-ui-font-color2, #666)',
          fontStyle: 'italic'
        }}>
          No rows match the search criteria
        </div>
      )}
    </div>
  );
};

export default MitoViewer;
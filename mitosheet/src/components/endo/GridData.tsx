import React from 'react';
import '../../../css/endo/GridData.css';
import { getBorderStyle, getIsCellSelected } from './selectionUtils';
import { calculateCurrentSheetView } from './sheetViewUtils';
import { ColumnID, EditorState, GridState, SheetData, UIState } from '../../types';
import { classNames } from '../../utils/classNames';
import { cellInSearch } from './utils';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { formatCellData } from '../../utils/formatColumns';
import { isNumberDtype } from '../../utils/dtypes';


const GridData = (props: {
    sheetData: SheetData | undefined,
    gridState: GridState,
    uiState: UIState
    editorState: EditorState | undefined;
}): JSX.Element => {

    const currentSheetView = calculateCurrentSheetView(props.gridState);
    const sheetData = props.sheetData

    return (
        <>  
            {sheetData && sheetData.numRows > 0 && Array(currentSheetView.numRowsRendered).fill(0).map((_, _rowIndex) => {
                const rowIndex = currentSheetView.startingRowIndex + _rowIndex;
                const columnIDs: ColumnID[] = props.sheetData ? Object.keys(props.sheetData.columnIDsMap) : [];

                const rowClassNames = classNames('row', {
                    'row-even': rowIndex % 2 === 0,
                    'row-odd': rowIndex % 2 !== 0
                }) 

                return (
                    <div className={rowClassNames} key={rowIndex}>
                        {Array(currentSheetView.numColumnsRendered).fill(0).map((_, _colIndex) => {
                            const columnIndex = currentSheetView.startingColumnIndex + _colIndex;
                            const columnID = columnIDs[columnIndex]
                            const columnDtype = props.sheetData?.data[columnIndex]?.columnDtype;
                            const columnFormatType = sheetData.columnFormatTypeObjMap[columnID]
                            const cellData = props.sheetData?.data[columnIndex]?.columnData[rowIndex];

                            if (cellData === undefined || columnDtype == undefined) {
                                return null;
                            }

                            const className = classNames('cell', {
                                'cell-selected': getIsCellSelected(props.gridState.selections, rowIndex, columnIndex),
                                'cell-hidden': props.editorState !== undefined && props.editorState.rowIndex === rowIndex && props.editorState.columnIndex === columnIndex,
                                'cell-searched': cellInSearch(cellData, props.gridState.searchString) && props.uiState.currOpenTaskpane.type === TaskpaneType.SEARCH,
                                'right-align-number-series': isNumberDtype(columnDtype)
                            });

                            const cellWidth = props.gridState.widthDataMap[props.gridState.dataframeID].widthArray[columnIndex];

                            // Format the cell
                            const displayCellData = formatCellData(cellData, columnDtype, columnFormatType)

                            return (
                                <div 
                                    className={className} key={columnIndex}
                                    style={{
                                        width: `${cellWidth}px`,
                                        ...getBorderStyle(props.gridState.selections, rowIndex, columnIndex, sheetData.numRows)
                                    }}
                                    tabIndex={-1}
                                    mito-col-index={columnIndex}
                                    mito-row-index={rowIndex}
                                    title={displayCellData}
                                >
                                    {displayCellData}
                                </div>
                            )
                        })}
                    </div>
                )
            })}
        </>
    )
}

export default React.memo(GridData);
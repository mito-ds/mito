import React from 'react';
import '../../../../css/endo/GridData.css';
import { getBorderStyle, getIsCellSelected } from './selectionUtils';
import { calculateCurrentSheetView } from './sheetViewUtils';
import { EditorState, GridState, SheetData, UIState } from '../../types';
import { classNames } from '../../utils/classNames';
import { getColumnIDsArrayFromSheetDataArray } from './utils';
import { formatCellData } from '../../utils/format';
import { isNumberDtype } from '../../utils/dtypes';
import { reconIsColumnCreated, reconIsColumnModified } from '../taskpanes/AITransformation/aiUtils';
import { hexToRGBString } from '../../utils/colors';
import CellDropdown from './CellDropdown';
import { Actions } from '../../utils/actions';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { isCurrOpenDropdownForCell } from './visibilityUtils';

export const EVEN_ROW_BACKGROUND_COLOR_DEFAULT = 'var(--mito-background)';
export const ODD_ROW_BACKGROUND_COLOR_DEFAULT = 'var(--mito-background-off)';
export const ROW_TEXT_COLOR_DEFAULT = 'var(--mito-text)';

const GridData = (props: {
    sheetData: SheetData | undefined;
    gridState: GridState;
    setGridState: React.Dispatch<React.SetStateAction<GridState>>;
    sheetIndex: number;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    editorState: EditorState | undefined;
    actions: Actions;
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
}): JSX.Element => {

    const currentSheetView = calculateCurrentSheetView(props.gridState);
    const sheetData = props.sheetData

    const evenRowBackgroundColor = sheetData?.dfFormat?.rows?.even?.backgroundColor || EVEN_ROW_BACKGROUND_COLOR_DEFAULT;
    const oddRowBackgroundColor = sheetData?.dfFormat?.rows?.odd?.backgroundColor || ODD_ROW_BACKGROUND_COLOR_DEFAULT;
    const evenRowTextColor = sheetData?.dfFormat?.rows?.even?.color || ROW_TEXT_COLOR_DEFAULT;
    const oddRowTextColor = sheetData?.dfFormat?.rows?.odd?.color || ROW_TEXT_COLOR_DEFAULT;

    return (
        <>  
            {sheetData && sheetData.numRows > 0 && Array(currentSheetView.numRowsRendered).fill(0).map((_, _rowIndex) => {
                const rowIndex = currentSheetView.startingRowIndex + _rowIndex;
                const columnIDs = getColumnIDsArrayFromSheetDataArray([sheetData])[0]

                const rowClassNames = classNames('mito-grid-row', {
                    'mito-grid-row-even': rowIndex % 2 === 0,
                    'mito-grid-row-odd': rowIndex % 2 !== 0
                }) 

                const style = rowIndex % 2 === 0 
                    ? {backgroundColor: evenRowBackgroundColor, color: evenRowTextColor} 
                    : {backgroundColor: oddRowBackgroundColor, color: oddRowTextColor};

                return (
                    <div className={rowClassNames} key={rowIndex} style={style}>
                        {Array(currentSheetView.numColumnsRendered).fill(0).map((_, _colIndex) => {
                            const columnIndex = currentSheetView.startingColumnIndex + _colIndex;
                            const columnID = columnIDs[columnIndex]
                            const columnDtype = props.sheetData?.data[columnIndex]?.columnDtype;
                            const index = props.sheetData?.index[rowIndex] !== undefined ? props.sheetData?.index[rowIndex] : 0;
                            const columnFormatType = sheetData.dfFormat.columns[columnID]
                            const cellData = props.sheetData?.data[columnIndex]?.columnData[rowIndex];
                            const cellIsSelected = getIsCellSelected(props.gridState.selections, rowIndex, columnIndex);
                            const columnHeader = props.sheetData?.data[columnIndex]?.columnHeader;

                            const conditionalFormatMap = sheetData?.conditionalFormattingResult.results[columnID];
                            const conditionalFormat = conditionalFormatMap ? {...conditionalFormatMap[index]} : undefined;


                            if (cellIsSelected && conditionalFormat?.backgroundColor !== undefined && conditionalFormat?.backgroundColor !== null) {
                                conditionalFormat.backgroundColor = hexToRGBString(conditionalFormat.backgroundColor, .4)
                            }

                            if (cellData === undefined || columnDtype === undefined || columnHeader === undefined) {
                                return null;
                            }

                            const isColumnCreated = reconIsColumnCreated(columnHeader, props.uiState.dataRecon, sheetData)
                            const isColumnModified = reconIsColumnModified(columnHeader, props.uiState.dataRecon, sheetData)

                            // Check if the cell is a search match. 
                            const matchesSearch = !!props.uiState.currOpenSearch.matches.find((value) => {
                                return value.rowIndex === rowIndex && value.colIndex === columnIndex
                            });

                            const className = classNames('mito-grid-cell', 'text-unselectable', {
                                'mito-grid-cell-selected': cellIsSelected,
                                'mito-grid-cell-conditional-format-background-color': conditionalFormat?.backgroundColor !== undefined,
                                'mito-grid-cell-hidden': props.editorState !== undefined && props.editorState.rowIndex === rowIndex && props.editorState.columnIndex === columnIndex,
                                'right-align-number-series': isNumberDtype(columnDtype),
                                'recon created-recon-background-color': isColumnCreated && rowIndex % 2 !== 0,
                                'recon created-recon-background-color-dark': isColumnCreated && rowIndex % 2 === 0,
                                'recon modified-recon-background-color': isColumnModified && rowIndex % 2 !== 0,
                                'recon modified-recon-background-color-dark': isColumnModified && rowIndex % 2 === 0,
                            });

                            const cellWidth = props.gridState.widthDataArray[props.gridState.sheetIndex].widthArray[columnIndex];

                            // Format the cell
                            const displayCellData = formatCellData(cellData, columnDtype, columnFormatType)

                            const displayDropdown = isCurrOpenDropdownForCell(props.uiState, rowIndex, columnIndex);

                            return (
                                <div 
                                    className={className} key={columnIndex}
                                    style={{
                                        width: `${cellWidth}px`,
                                        ...getBorderStyle(props.gridState.selections, props.gridState.copiedSelections, rowIndex, columnIndex, sheetData.numRows, matchesSearch, props.uiState.highlightedColumnIndex),
                                        ...(conditionalFormat || {})
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        props.setUIState((prevUiState) => {
                                            return {
                                                ...prevUiState,
                                                currOpenDropdown: {
                                                    rowIndex: rowIndex,
                                                    columnIndex: columnIndex
                                                }
                                            }
                                        });
                                        props.setGridState((prevGridState: GridState) => {
                                            return {
                                                ...prevGridState,
                                                selections: [{
                                                    startingRowIndex: rowIndex,
                                                    endingRowIndex: rowIndex,
                                                    startingColumnIndex: columnIndex,
                                                    endingColumnIndex: columnIndex,
                                                    sheetIndex: props.sheetIndex
                                                }]
                                            }
                                        });
                                    
                                    }}
                                    tabIndex={-1}
                                    mito-col-index={columnIndex}
                                    mito-row-index={rowIndex}
                                    title={displayCellData}
                                >
                                    {displayCellData}
                                    <CellDropdown
                                        display={displayDropdown}
                                        rowIndex={rowIndex}
                                        colIndex={columnIndex}
                                        setUiState={props.setUIState}
                                        actions={props.actions}
                                        closeOpenEditingPopups={props.closeOpenEditingPopups}
                                    />
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
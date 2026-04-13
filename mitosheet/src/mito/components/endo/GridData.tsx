/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useMemo } from 'react';
import '../../../../css/endo/GridData.css';
import '../../../../css/endo/GhostColumn.css';
import { getBorderStyle, getIsCellSelected } from './selectionUtils';
import { calculateCurrentSheetView, gridStateForView } from './sheetViewUtils';
import { AIGhostSuggestedColumn, EditorState, GridState, SheetData, UIState, WidthData } from '../../types';
import { classNames } from '../../utils/classNames';
import { getColumnIDsArrayFromSheetDataArray } from './utils';
import { formatCellData } from '../../utils/format';
import { isNumberDtype } from '../../utils/dtypes';
import { reconIsColumnCreated, reconIsColumnModified } from '../taskpanes/AITransformation/aiUtils';
import { hexToRGBString } from '../../utils/colors';
import { Actions } from '../../utils/actions';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { isCurrOpenDropdownForCell } from './visibilityUtils';
import CellContextMenu from './CellContextMenu';
import {
    cellHasAIModeCellHighlight,
    getStreamlitAIModeAnnotationForClick,
} from '../../utils/streamlitAIModeUtils';

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
    /** Includes trailing ghost column widths (may exceed sheetData.numColumns). */
    layoutWidthData: WidthData;
    ghostSuggestedColumns: AIGhostSuggestedColumn[];
}): JSX.Element => {

    const currentSheetView = useMemo(
        () =>
            calculateCurrentSheetView(
                gridStateForView(props.gridState, props.sheetIndex),
                props.layoutWidthData
            ),
        [props.gridState, props.sheetIndex, props.layoutWidthData]
    );
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

                const exitAnim = props.uiState.gridRowExitAnimation;
                const isRowExiting =
                    exitAnim !== undefined &&
                    exitAnim.sheetIndex === props.sheetIndex &&
                    exitAnim.rowIndices.includes(rowIndex);

                const colEnterAnim = props.uiState.gridColumnEnterAnimation;
                const colExitAnim = props.uiState.gridColumnExitAnimation;
                const rowEnterAnim = props.uiState.gridRowEnterAnimation;
                const selPulse = props.uiState.gridSelectionPulse;
                const editPulse = props.uiState.gridEditCommitPulse;

                const rowClassNames = classNames('mito-grid-row', {
                    'mito-grid-row-even': rowIndex % 2 === 0,
                    'mito-grid-row-odd': rowIndex % 2 !== 0,
                    'mito-grid-row-exit': isRowExiting,
                }) 

                const style = rowIndex % 2 === 0 
                    ? {backgroundColor: evenRowBackgroundColor, color: evenRowTextColor} 
                    : {backgroundColor: oddRowBackgroundColor, color: oddRowTextColor};

                const rowStyle: React.CSSProperties = isRowExiting
                    ? {
                        ...style,
                        animation: 'mito-row-delete-exit 0.55s ease forwards',
                        pointerEvents: 'none',
                    }
                    : style;

                return (
                    <div className={rowClassNames} key={rowIndex} style={rowStyle}>
                        {Array(currentSheetView.numColumnsRendered).fill(0).map((_, _colIndex) => {
                            const columnIndex = currentSheetView.startingColumnIndex + _colIndex;

                            if (columnIndex >= sheetData.numColumns) {
                                const ghost =
                                    props.ghostSuggestedColumns[columnIndex - sheetData.numColumns];
                                if (ghost === undefined) {
                                    return null;
                                }
                                const cellWidth =
                                    props.layoutWidthData.widthArray[columnIndex] ?? 123;
                                const raw = ghost.previewValues[rowIndex];
                                const displayGhost =
                                    raw === undefined ||
                                    raw === null ||
                                    (typeof raw === 'number' && Number.isNaN(raw))
                                        ? ''
                                        : formatCellData(
                                              raw,
                                              ghost.columnDtype,
                                              undefined
                                          );
                                return (
                                    <div
                                        className={classNames(
                                            'mito-grid-cell',
                                            'text-unselectable',
                                            'mito-grid-cell-ghost',
                                            {
                                                'right-align-number-series': isNumberDtype(
                                                    ghost.columnDtype
                                                ),
                                            }
                                        )}
                                        key={`ghost-${columnIndex}`}
                                        style={{
                                            width: `${cellWidth}px`,
                                            ...getBorderStyle(
                                                props.gridState.selections,
                                                props.gridState.copiedSelections,
                                                rowIndex,
                                                columnIndex,
                                                sheetData.numRows,
                                                false,
                                                props.uiState.highlightedColumnIndex
                                            ),
                                        }}
                                        tabIndex={-1}
                                        mito-col-index={columnIndex}
                                        mito-row-index={rowIndex}
                                        title={displayGhost}
                                    >
                                        {displayGhost}
                                    </div>
                                );
                            }

                            const isColumnEntering =
                                colEnterAnim !== undefined &&
                                colEnterAnim.sheetIndex === props.sheetIndex &&
                                colEnterAnim.columnIndex === columnIndex;
                            const isColumnExiting =
                                colExitAnim !== undefined &&
                                colExitAnim.sheetIndex === props.sheetIndex &&
                                colExitAnim.columnIndices.includes(columnIndex);
                            const isRowEntering =
                                rowEnterAnim !== undefined &&
                                rowEnterAnim.sheetIndex === props.sheetIndex &&
                                rowEnterAnim.rowIndices.includes(rowIndex);
                            const isSelectionPulse =
                                selPulse !== undefined &&
                                selPulse.sheetIndex === props.sheetIndex &&
                                selPulse.rowIndex === rowIndex &&
                                selPulse.columnIndex === columnIndex;
                            const isEditCommitPulse =
                                editPulse !== undefined &&
                                editPulse.sheetIndex === props.sheetIndex &&
                                editPulse.rowIndex === rowIndex &&
                                editPulse.columnIndex === columnIndex;
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

                            if (columnDtype === undefined || columnHeader === undefined) {
                                return null;
                            }

                            const isColumnCreated = reconIsColumnCreated(columnHeader, props.uiState.dataRecon, sheetData)
                            const isColumnModified = reconIsColumnModified(columnHeader, props.uiState.dataRecon, sheetData)

                            // Check if the cell is a search match. 
                            const matchesSearch = !!props.uiState.currOpenSearch.matches.find((value) => {
                                return value.rowIndex === rowIndex && value.colIndex === columnIndex
                            });

                            const streamlitAiCellNote = cellHasAIModeCellHighlight(
                                props.uiState.streamlitAIModeAnnotations,
                                props.sheetIndex,
                                rowIndex,
                                columnIndex,
                                sheetData.numRows
                            );

                            const className = classNames('mito-grid-cell', 'text-unselectable', {
                                'mito-grid-cell-selected': cellIsSelected,
                                'mito-grid-cell-conditional-format-background-color': conditionalFormat?.backgroundColor !== undefined,
                                'mito-grid-cell-hidden': props.editorState !== undefined && props.editorState.rowIndex === rowIndex && props.editorState.columnIndex === columnIndex,
                                'right-align-number-series': isNumberDtype(columnDtype),
                                'recon created-recon-background-color': isColumnCreated && rowIndex % 2 !== 0,
                                'recon created-recon-background-color-dark': isColumnCreated && rowIndex % 2 === 0,
                                'recon modified-recon-background-color': isColumnModified && rowIndex % 2 !== 0,
                                'recon modified-recon-background-color-dark': isColumnModified && rowIndex % 2 === 0,
                                'mito-grid-cell-has-ai-note': streamlitAiCellNote,
                                'mito-grid-column-enter': isColumnEntering,
                                'mito-grid-column-exit': isColumnExiting,
                                'mito-grid-row-enter': isRowEntering,
                                'mito-grid-cell-selection-pulse': isSelectionPulse,
                                'mito-grid-cell-edit-commit-pulse': isEditCommitPulse,
                            });

                            const cellWidth =
                                props.layoutWidthData.widthArray[columnIndex] ?? 123;

                            // Format the cell (missing values may be undefined in columnData)
                            const displayCellData =
                                cellData === undefined ||
                                cellData === null ||
                                (typeof cellData === 'number' && Number.isNaN(cellData))
                                    ? ''
                                    : formatCellData(
                                          cellData,
                                          columnDtype,
                                          columnFormatType
                                      );

                            const displayDropdown = isCurrOpenDropdownForCell(props.uiState, rowIndex, columnIndex);

                            const cellBaseStyle: React.CSSProperties = {
                                width: `${cellWidth}px`,
                                ...getBorderStyle(props.gridState.selections, props.gridState.copiedSelections, rowIndex, columnIndex, sheetData.numRows, matchesSearch, props.uiState.highlightedColumnIndex),
                                ...(conditionalFormat || {}),
                            };
                            let cellStyle: React.CSSProperties = cellBaseStyle;
                            if (isColumnEntering) {
                                cellStyle = {
                                    ...cellBaseStyle,
                                    animation: 'mito-column-enter 0.6s ease both',
                                };
                            } else if (isColumnExiting) {
                                cellStyle = {
                                    ...cellBaseStyle,
                                    animation: 'mito-column-delete-exit 0.55s ease forwards',
                                    pointerEvents: 'none',
                                };
                            } else if (isRowEntering) {
                                cellStyle = {
                                    ...cellBaseStyle,
                                    animation: 'mito-row-enter 0.5s ease both',
                                };
                            } else if (isSelectionPulse) {
                                cellStyle = {
                                    ...cellBaseStyle,
                                    animation: 'mito-cell-selection-pulse 0.4s ease',
                                };
                            } else if (isEditCommitPulse) {
                                cellStyle = {
                                    ...cellBaseStyle,
                                    animation: 'mito-cell-edit-commit-pulse 0.42s ease',
                                };
                            }

                            return (
                                <div 
                                    className={className} key={columnIndex}
                                    style={cellStyle}
                                    onContextMenu={(e) => {
                                        if (e.shiftKey) {
                                            return;
                                        }
                                        e.preventDefault();
                                        e.stopPropagation();
                                        props.setUIState((prevUiState) => {
                                            return {
                                                ...prevUiState,
                                                currOpenDropdown: {
                                                    type: 'context-menu',
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
                                    {streamlitAiCellNote && (
                                        <button
                                            type="button"
                                            className="mito-grid-cell-ai-corner"
                                            title="Open AI note"
                                            aria-label="Open AI note for this cell"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const ann = getStreamlitAIModeAnnotationForClick(
                                                    props.uiState.streamlitAIModeAnnotations,
                                                    props.sheetIndex,
                                                    rowIndex,
                                                    columnIndex
                                                );
                                                if (ann === undefined) {
                                                    return;
                                                }
                                                props.setUIState((prev) => ({
                                                    ...prev,
                                                    streamlitAIModePopover: {
                                                        annotationId: ann.id,
                                                        x: e.clientX,
                                                        y: e.clientY,
                                                        openedFrom: 'cell',
                                                    },
                                                }));
                                            }}
                                        />
                                    )}
                                    {displayCellData}
                                    <CellContextMenu
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

export default GridData;
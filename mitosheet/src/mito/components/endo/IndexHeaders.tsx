/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useMemo } from 'react';
import '../../../../css/endo/IndexHeaders.css';
import { getBorderStyle, getIsCellSelected } from './selectionUtils';
import { calculateCurrentSheetView, calculateTranslate, gridStateForView } from './sheetViewUtils';
import { GridState, SheetData, UIState } from '../../types';
import { classNames } from '../../utils/classNames';
import IndexHeaderDropdown from './IndexHeaderContextMenu';
import { MitoAPI } from '../../api/api';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { isCurrOpenDropdownForCell } from './visibilityUtils';
import { Actions } from '../../utils/actions';

/* 
    The headers on the side of the sheet that display
    the indexes of the dataframe.
*/
const IndexHeaders = (props: {
    sheetData: SheetData,
    gridState: GridState,
    mitoAPI: MitoAPI,
    uiState: UIState,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    sheetIndex: number,
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
    actions: Actions
}): JSX.Element => {

    // NOTE: this is indexed by index in the sheet, not by the label
    const currentSheetView = useMemo(
        () => calculateCurrentSheetView(gridStateForView(props.gridState, props.sheetIndex)),
        [props.gridState, props.sheetIndex]
    );
    const translate = useMemo(
        () => calculateTranslate(gridStateForView(props.gridState, props.sheetIndex)),
        [props.gridState, props.sheetIndex]
    );

    const indexHeadersStyle = {
        transform: `translateY(${-translate.y}px)`,
    };

    return (
        <>
            <div className="endo-index-headers-container">
                {props.sheetData.numRows > 0 && 
                    <div style={indexHeadersStyle}>
                        {Array(currentSheetView.numRowsRendered).fill(0).map((_, _rowIndex) => {
                            const rowIndex = currentSheetView.startingRowIndex + _rowIndex;

                            if (rowIndex >= props.sheetData.numRows) {
                                return null;
                            }

                            const selected = getIsCellSelected(
                                props.gridState.selections,
                                rowIndex,
                                -1
                            );
                            const exitAnim = props.uiState.gridRowExitAnimation;
                            const isRowExiting =
                                exitAnim !== undefined &&
                                exitAnim.sheetIndex === props.sheetIndex &&
                                exitAnim.rowIndices.includes(rowIndex);
                            const enterAnim = props.uiState.gridRowEnterAnimation;
                            const isRowEntering =
                                enterAnim !== undefined &&
                                enterAnim.sheetIndex === props.sheetIndex &&
                                enterAnim.rowIndices.includes(rowIndex);

                            const className = classNames(
                                'index-header-container',
                                'text-overflow-hide',
                                'text-unselectable',
                                {
                                    'index-header-selected': selected,
                                    'mito-index-row-exit': isRowExiting,
                                    'mito-grid-row-enter': isRowEntering,
                                }
                            );
                            const indexHeader = rowIndex >= props.sheetData.numRows ? '' : props.sheetData.index[rowIndex];

                            return (
                                <div
                                    className={className}
                                    key={rowIndex}
                                    title={indexHeader + ''}
                                    tabIndex={-1}
                                    mito-row-index={rowIndex}
                                    mito-col-index={-1}
                                    style={{
                                        ...getBorderStyle(props.gridState.selections, props.gridState.copiedSelections, rowIndex, -1, props.sheetData.numRows, false),
                                        ...(isRowExiting
                                            ? {
                                                  animation: 'mito-row-delete-exit 0.55s ease forwards',
                                                  pointerEvents: 'none',
                                              }
                                            : isRowEntering
                                              ? { animation: 'mito-row-enter 0.5s ease both' }
                                              : {}),
                                    }}
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
                                                    columnIndex: -1
                                                }
                                            }
                                        });
                                    }}
                                >
                                    {indexHeader}
                                    <IndexHeaderDropdown
                                        rowIndex={rowIndex}
                                        display={isCurrOpenDropdownForCell(props.uiState, rowIndex, -1)}
                                        setUIState={props.setUIState}
                                        actions={props.actions}
                                        closeOpenEditingPopups={props.closeOpenEditingPopups}
                                    />
                                </div>
                            )
                        })}
                    </div>
                }   
            </div>
        </>
    )
}

export default IndexHeaders;
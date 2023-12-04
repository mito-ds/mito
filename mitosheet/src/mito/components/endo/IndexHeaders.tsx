import React from 'react';
import '../../../../css/endo/IndexHeaders.css';
import { getBorderStyle, getIsCellSelected } from './selectionUtils';
import { calculateCurrentSheetView, calculateTranslate } from './sheetViewUtils';
import { GridState, SheetData, UIState } from '../../types';
import { classNames } from '../../utils/classNames';
import IndexHeaderDropdown from './IndexHeaderDropdown';
import { MitoAPI } from '../../api/api';
import { TaskpaneType } from '../taskpanes/taskpanes';
import { isCurrOpenDropdownForCell } from './visibilityUtils';

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
}): JSX.Element => {

    // NOTE: this is indexed by index in the sheet, not by the label
    const currentSheetView = calculateCurrentSheetView(props.gridState);
    const translate = calculateTranslate(props.gridState);

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
                            const selected = getIsCellSelected(
                                props.gridState.selections,
                                rowIndex,
                                -1
                            );
                            const className = classNames('index-header-container', 'text-overflow-hide', 'text-unselectable', {'index-header-selected': selected});
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
                                        ...getBorderStyle(props.gridState.selections, props.gridState.copiedSelections, rowIndex, -1, props.sheetData.numRows, false)
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        props.setUIState((prevUiState) => {
                                            return {
                                                ...prevUiState,
                                                currOpenDropdown: {
                                                    row: rowIndex,
                                                    column: -1
                                                }
                                            }
                                        });
                                    }}
                                >
                                    {indexHeader}
                                    <IndexHeaderDropdown
                                        sheetData={props.sheetData}
                                        setUIState={props.setUIState}
                                        display={isCurrOpenDropdownForCell(props.uiState, rowIndex, -1)}
                                        index={indexHeader}
                                        mitoAPI={props.mitoAPI}
                                        sheetIndex={props.sheetIndex}
                                        selections={props.gridState.selections}
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

export default React.memo(IndexHeaders);
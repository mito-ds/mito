import React, { useState } from 'react';
import '../../../css/endo/IndexHeaders.css';
import { getBorderStyle, getIsCellSelected } from './selectionUtils';
import { calculateCurrentSheetView, calculateTranslate } from './sheetViewUtils';
import { GridState, SheetData, UIState } from '../../types';
import { classNames } from '../../utils/classNames';
import IndexHeaderDropdown from './IndexHeaderDropdown';
import MitoAPI from '../../jupyter/api';
import { TaskpaneType } from '../taskpanes/taskpanes';

/* 
    The headers on the side of the sheet that display
    the indexes of the dataframe.
*/
const IndexHeaders = (props: {
    mitoAPI: MitoAPI,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    sheetIndex: number;
    closeOpenEditingPopups: (taskpanesToKeepIfOpen?: TaskpaneType[]) => void;
    sheetData: SheetData,
    gridState: GridState
}): JSX.Element => {

    const [openIndexHeaderDropdown, setOpenIndexHeaderDropdown] = useState<string | number | undefined>(undefined);

    const currentSheetView = calculateCurrentSheetView(props.gridState);
    const translate = calculateTranslate(props.gridState);

    const indexHeadersStyle = {
        transform: `translateY(${-translate.y}px)`,
    };

    return (
        <>
            <div className="index-headers-container">
                {props.sheetData.numRows > 0 && 
                    <div style={indexHeadersStyle}>
                        {Array(currentSheetView.numRowsRendered).fill(0).map((_, _rowIndex) => {
                            const rowIndex = currentSheetView.startingRowIndex + _rowIndex;
                            const selected = getIsCellSelected(
                                props.gridState.selections,
                                rowIndex,
                                -1
                            );
                            const className = classNames('index-header-container', 'text-overflow-hide', {'index-header-selected': selected});
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
                                        ...getBorderStyle(props.gridState.selections, rowIndex, -1, props.sheetData.numRows)
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setOpenIndexHeaderDropdown(indexHeader);
                                    }}
                                >
                                    {indexHeader}
                                    {openIndexHeaderDropdown !== undefined && openIndexHeaderDropdown === indexHeader &&
                                        <IndexHeaderDropdown
                                            mitoAPI={props.mitoAPI}
                                            setOpenIndexHeaderDropdown={setOpenIndexHeaderDropdown}
                                            setUIState={props.setUIState}
                                            sheetIndex={props.sheetIndex}
                                            index={indexHeader}
                                            sheetData={props.sheetData}
                                            closeOpenEditingPopups={props.closeOpenEditingPopups}
                                        />
                                    
                                    }
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
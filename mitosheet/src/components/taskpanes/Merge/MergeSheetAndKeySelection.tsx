// Copyright (c) Mito

import React from 'react';

// import css
import '../../../../css/taskpanes/Merge/MergeSheetAndKeySelection.css'
import { MergeSheet } from './MergeTaskpane';
import Select from '../../elements/Select';
import { ColumnID, DataframeID, SheetData } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';

/* 
  A custom component that allows you to select a sheet from the list of
  possible sheets, as well as a column header from that sheet.
*/
const MergeSheetAndKeySelection = (props: {
    sheetDataMap: Record<DataframeID, SheetData>,
    originalDataframeIDs: DataframeID[],
    dataframeID: DataframeID,
    otherDataframeID: DataframeID,
    mergeKeyColumnID: ColumnID,
    sheetNum: MergeSheet;
    setNewDataframeID: (newDataframeID: DataframeID) => void,
    setNewMergeKeyColumnID: (newMergeKeyColumnID: ColumnID) => void,
}): JSX.Element => {

    const sheetNumStr = props.sheetNum == MergeSheet.First ? 'First' : 'Second'

    return (
        <div className='merge-sheet-and-key mt-15px'>
            <div>
                <p className='text-header-3'>
                    {sheetNumStr} Sheet
                </p>
                <Select
                    value={props.sheetDataMap[props.dataframeID]?.dfName}
                    onChange={(dataframeID: DataframeID) => {
                        // Safe cast as df names are all strings
                        props.setNewDataframeID(dataframeID);
                    }}
                    width='medium'
                >
                    {Object.entries(props.sheetDataMap).filter(([dataframeID, sheetData]) => {
                        // Filter out any newly created dataframes, so users cannot
                        // select output of the merge as an input
                        if (!props.originalDataframeIDs.includes(dataframeID)) {
                            return false;
                        }
                        return true;
                    }).map(([dataframeID, sheetData]) => {
                        return (
                            <DropdownItem
                                key={dataframeID}
                                title={sheetData.dfName}
                                id={dataframeID}
                            />
                        )
                    }).filter(element => element !== null)}
                </Select>
            </div>
            <div>
                <p className='text-header-3'>
                    Merge Key
                </p>
                <Select
                    value={props.mergeKeyColumnID}
                    onChange={(columnID: ColumnID) => {props.setNewMergeKeyColumnID(columnID)}}
                    width='medium'
                    searchable
                >
                    {Object.entries(props.sheetDataMap[props.dataframeID]?.columnIDsMap || {}).map(([columnID, columnHeader]) => {
                        return (
                            <DropdownItem
                                key={columnID}
                                id={columnID}
                                title={getDisplayColumnHeader(columnHeader)}
                            />
                        )
                    })}
                </Select>
            </div>
        </div>
    )
} 

export default MergeSheetAndKeySelection


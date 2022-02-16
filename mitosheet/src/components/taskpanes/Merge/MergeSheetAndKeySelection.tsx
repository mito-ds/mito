// Copyright (c) Mito

import React from 'react';

// import css
import '../../../../css/taskpanes/Merge/MergeSheetAndKeySelection.css'
import { MergeSheet } from './MergeTaskpane';
import Select from '../../elements/Select';
import { ColumnID, ColumnIDsMap } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';

/* 
  A custom component that allows you to select a sheet from the list of
  possible sheets, as well as a column header from that sheet.
*/
const MergeSheetAndKeySelection = (props: {
    dfNames: string[],
    columnIDsMap: ColumnIDsMap,
    sheetIndex: number,
    mergeKeyColumnID: ColumnID,
    otherSheetIndex: number,
    sheetNum: MergeSheet;
    setNewSheetIndex: (newSheetIndex: number) => void,
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
                    value={props.dfNames[props.sheetIndex]}
                    onChange={(dfName: string) => {
                        // Safe cast as df names are all strings
                        const newSheetIndex = props.dfNames.indexOf(dfName)
                        props.setNewSheetIndex(newSheetIndex);
                    }}
                    width='medium'
                >
                    {props.dfNames.map(dfName => {
                        return (
                            <DropdownItem
                                key={dfName}
                                title={dfName}
                            />
                        )
                    })}
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
                    {Object.entries(props.columnIDsMap).map(([columnID, columnHeader]) => {
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


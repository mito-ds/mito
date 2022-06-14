// Copyright (c) Mito

import React from 'react';

// import css
import '../../../../css/taskpanes/Merge/MergeSheetAndKeySelection.css'
import { MergeSheet } from './MergeTaskpane';
import Select from '../../elements/Select';
import { ColumnID, ColumnIDsMap, SheetData } from '../../../types';
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
    sheetDataArray: SheetData[]
    setNewSheetIndex: (newSheetIndex: number) => void,
    setNewMergeKeyColumnID: (newMergeKeyColumnID: ColumnID) => void,
}): JSX.Element => {

    const sheetNumStr = props.sheetNum == MergeSheet.First ? 'First' : 'Second'

    return (
        <div className='merge-sheet-and-key mt-15px'>
            <div>
                <p className='text-header-3'>
                    {sheetNumStr} Dataframe
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
                    {props.dfNames.map((dfName, index) => {
                        // Don't let the user select a sheet that has no data in it
                        const enabled = props.sheetDataArray.length > index && props.sheetDataArray[index].numColumns > 0
                        return (
                            <DropdownItem
                                key={dfName}
                                title={dfName}
                                disabled={enabled ? undefined : true}
                                displaySubtextOnHover={enabled ? false : true}
                                subtext={enabled ? undefined : 'This sheet contains no data to merge'}
                                hideSubtext={true}
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
                    {Object.entries(props.columnIDsMap || {}).map(([columnID, columnHeader]) => {
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


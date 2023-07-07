// Copyright (c) Mito

import React, { useEffect } from 'react';
import { MitoAPI } from '../../../api/api';
import { ColumnID, ColumnIDsMap } from '../../../types';

/* 
    A component that takes the selected columns in a section, as well
    as the valid columns for a section, and returns an error div if columns
    that do not exist are selected.

    If you are editing a pivot table, then reopening the editing interface with old params
    can result in the params being out of date (e.g. you have a column header that no longer
    exists).

    As such, we detect these invalid columns, and display an error that tells the user that
    they need to delete these columns to make the pivot valid.
*/
const PivotInvalidSelectedColumnsError = (props: {
    columnIDsMap: ColumnIDsMap;

    pivotSection: 'row' | 'column' | 'values';
    selectedColumnIDs: ColumnID[];

    mitoAPI: MitoAPI;
}): JSX.Element => {

    const invalidSelectedColumnIDs = props.selectedColumnIDs.filter(columnID => 
        props.columnIDsMap[columnID] === undefined
    );

    // Log if there are any invalid columns
    useEffect(() => {
        if (invalidSelectedColumnIDs.length > 0) {
            void props.mitoAPI.log('pivot_invalid_selected_columns', {
                'pivot_section': props.pivotSection,
                'num_invalid': invalidSelectedColumnIDs.length
            })
        }
    }, [])

    return (
        <>
            {invalidSelectedColumnIDs.length > 0 && 
                // Note: we hide X overflow so that really long column headers don't make the pivot
                // scrollable
                <div className='text-color-error' style={{overflowX: 'hidden'}}>
                    The {invalidSelectedColumnIDs.length === 1 ? 'column' : 'columns'} {invalidSelectedColumnIDs.length === 1 ? invalidSelectedColumnIDs[0] : invalidSelectedColumnIDs.join(', ')} {invalidSelectedColumnIDs.length === 1 ? 'does' : 'do'} not exist in this sheet anymore. Delete {invalidSelectedColumnIDs.length === 1 ? 'it' : 'them'} to make this pivot valid.
                </div>
            }
        </>
    )
} 

export default PivotInvalidSelectedColumnsError
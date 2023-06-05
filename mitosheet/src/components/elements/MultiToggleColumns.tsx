// Copyright (c) Mito
import React from 'react';
import MitoAPI from '../../jupyter/api';
import { ColumnHeader, ColumnID, SheetData } from '../../types';
import { toggleInArray } from '../../utils/arrays';
import { getDisplayColumnHeader } from '../../utils/columnHeaders';
import { getDtypeValue } from '../taskpanes/ControlPanel/FilterAndSortTab/DtypeCard';
import InvalidSelectedColumnsError from '../taskpanes/PivotTable/InvalidSelectedColumnsError';
import MultiToggleBox from './MultiToggleBox';
import MultiToggleItem from './MultiToggleItem';
import { Height } from './sizes.d';

interface MultiToggleColumnsProps {
    sheetData: SheetData | undefined;
    selectedColumnIDs: ColumnID[],
    onChange: (newSelectedColumnIDs: ColumnID[]) => void;
    height?: Height;
    disabledColumnIDs?: ColumnID[],
    getIsDisabledColumnID?: (columnID: ColumnID, columnHeader: ColumnHeader, columnDtype: string) => boolean;
    getDisplayColumnHeaderOverride?: (columnID: ColumnID, columnHeader: ColumnHeader) => string;
    mitoAPI: MitoAPI
}

/**
 * The MultiToggleColumns component allows the user to toggle and select multiple
 * different columns at once
 */
const MultiToggleColumns = (props: MultiToggleColumnsProps): JSX.Element => {

    const columnIDsMap = props.sheetData?.columnIDsMap || {};
    const columnIDsAndDtype: [ColumnID, string][] = Object.entries(props.sheetData?.columnDtypeMap || {});
    const columnIDs: ColumnID[] = columnIDsAndDtype.map(([cid, ]) => {return cid});
    
    const invalidSelectedColumns = props.selectedColumnIDs.filter(columnID => !Object.keys(props.sheetData?.columnDtypeMap || {}).includes(columnID))
    const invalidSelectedMultiToggleItems = invalidSelectedColumns.map((columnID, index) => {

        return (<MultiToggleItem
            key={'invalid: ' + index}
            index={index}
            title={columnID} // Since the column is deleted, we can't get the column header
            rightText={undefined}
            toggled={true}
            onToggle={() => {
                const newSelectedColumnIds = [...props.selectedColumnIDs];
                toggleInArray(newSelectedColumnIds, columnID);
                props.onChange(newSelectedColumnIds);
            }}
            invalid
        />)
    })

    const validMultiToggleItems = columnIDsAndDtype.map(([columnID, columnDtype], index) => {
        const columnHeader = columnIDsMap[columnID];

        const toggle = props.selectedColumnIDs.includes(columnID);
        const disabled = (props.disabledColumnIDs !== undefined && props.disabledColumnIDs.includes(columnID)) 
            || (props.getIsDisabledColumnID !== undefined && props.getIsDisabledColumnID(columnID, columnHeader, columnDtype));

        const displayColumnHeader = props.getDisplayColumnHeaderOverride !== undefined 
            ? props.getDisplayColumnHeaderOverride(columnID, columnHeader)
            : getDisplayColumnHeader(columnHeader);

        return (
            <MultiToggleItem
                key={'valid: ' + index}
                title={displayColumnHeader}
                rightText={getDtypeValue(columnDtype)}
                toggled={toggle}
                onToggle={() => {
                    const newSelectedColumnIds = [...props.selectedColumnIDs];
                    toggleInArray(newSelectedColumnIds, columnID);
                    props.onChange(newSelectedColumnIds);
                }}
                disabled={disabled}
            />
        ) 
    })

    const allMultiToggleItems = invalidSelectedMultiToggleItems.concat(validMultiToggleItems);

    return (
        <div>
            <InvalidSelectedColumnsError 
                columnIDsMap={columnIDsMap} 
                location={'multi toggle columns'} 
                selectedColumnIDs={props.selectedColumnIDs} 
                mitoAPI={props.mitoAPI}            
            />
            <MultiToggleBox
                searchable
                onToggleAll={(newSelectedIndexes) => {
                    const newSelectedColumnIDs = newSelectedIndexes.map(index => {return columnIDs[index]});
                    props.onChange(newSelectedColumnIDs);
                }}
                height='medium'
            >
                {allMultiToggleItems}
            </MultiToggleBox>
        </div>
        
    )
}

export default MultiToggleColumns;
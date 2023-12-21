// Copyright (c) Mito
import React from 'react';
import { ColumnHeader, ColumnID, SheetData } from '../../types';
import { toggleInArray } from '../../utils/arrays';
import { getDisplayColumnHeader } from '../../utils/columnHeaders';
import { getDtypeValue } from '../taskpanes/ControlPanel/FilterAndSortTab/DtypeCard';
import MultiToggleBox from './MultiToggleBox';
import MultiToggleItem from './MultiToggleItem';
import { Height } from './sizes.d';
import CautionIcon from '../icons/CautionIcon';

interface MultiToggleColumnsProps {
    sheetData: SheetData | undefined;
    selectedColumnIDs: ColumnID[],
    onChange: (newSelectedColumnIDs: ColumnID[]) => void;
    height?: Height;
    disabledColumnIDs?: ColumnID[],
    getIsDisabledColumnID?: (columnID: ColumnID, columnHeader: ColumnHeader, columnDtype: string) => boolean;
    getDisplayColumnHeaderOverride?: (columnID: ColumnID, columnHeader: ColumnHeader) => string;
    warning?: string;
}

/**
 * The MultiToggleColumns component allows the user to toggle and select multiple
 * different columns at once
 */
const MultiToggleColumns = (props: MultiToggleColumnsProps): JSX.Element => {

    const columnIDsMap = props.sheetData?.columnIDsMap || {};
    const [hasClicked, setHasClicked] = React.useState(false);
    const columnIDsAndDtype: [ColumnID, string][] = Object.entries(props.sheetData?.columnDtypeMap || {});
    const columnIDs: ColumnID[] = columnIDsAndDtype.map(([cid, ]) => {return cid});

    return (
        <div onMouseDown={() => {
            // If there is a warning displayed about missing columns
            // we want to hide it after the user clicks (assuming they are addressing the warning)
            if (!hasClicked) {
                setHasClicked(true);
                props.onChange(props.selectedColumnIDs.filter((columnID) => {
                    return columnIDsMap[columnID] !== undefined;
                }))
            }
        }}>
            {(props.warning !== undefined && !hasClicked) &&
                <div className='caution-text-container'>
                    <CautionIcon width={'25px'} height={'30px'} color='var(--mito-status-warning-dark)'/>
                    <p className='caution-text'>{props.warning}</p>
                </div> 
            }
            <MultiToggleBox
                searchable
                onToggleAll={(newSelectedIndexes) => {
                    const newSelectedColumnIDs = newSelectedIndexes.map(index => {return columnIDs[index]});
                    props.onChange(newSelectedColumnIDs);
                }}
                height='medium'
            >
                {[...columnIDsAndDtype.map(([columnID, columnDtype], index) => {
                    const columnHeader = columnIDsMap[columnID];

                    const toggle = props.selectedColumnIDs.includes(columnID);
                    const disabled = (props.disabledColumnIDs !== undefined && props.disabledColumnIDs.includes(columnID)) 
                        || (props.getIsDisabledColumnID !== undefined && props.getIsDisabledColumnID(columnID, columnHeader, columnDtype));

                    const displayColumnHeader = props.getDisplayColumnHeaderOverride !== undefined 
                        ? props.getDisplayColumnHeaderOverride(columnID, columnHeader)
                        : getDisplayColumnHeader(columnHeader);

                    return (
                        <MultiToggleItem
                            key={index}
                            index={index}
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
            ]}
            </MultiToggleBox>
        </div>
    )
}

export default MultiToggleColumns;
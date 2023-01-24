// Copyright (c) Mito
import React from 'react';
import { SheetData, UIState } from '../../types';
import { addIfAbsent, removeIfPresent, toggleInArray } from '../../utils/arrays';
import MultiToggleBox from './MultiToggleBox';
import MultiToggleItem from './MultiToggleItem';
import { Height } from './sizes.d';

interface DataframeMultiSelectProps {
    sheetDataArray: SheetData[];
    selectedSheetIndexes: number[];
    onChange: (newSelectedSheetIndexes: number[]) => void;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    height?: Height;
}

/**
 * The DataframeMultiSelect component allows the user to toggle and select multiple
 * different dataframes at once
 */
const DataframeMultiSelect = (props: DataframeMultiSelectProps): JSX.Element => {

    const selectedSheetIndexes = [...props.selectedSheetIndexes].sort()

    return (
        <MultiToggleBox
            width='block'
            height={props.height || 'small'}
            toggleAllIndexes={(indexesToToggle, newToggle) => {
                // We make the assumption that the order of the sheets in the MultiToggleBox
                // is the same as the order in the sheet. 
                const newSelectedSheetIndexes = [...selectedSheetIndexes]
                indexesToToggle.forEach(sheetIndex => {
                    if (newToggle) {
                        addIfAbsent(newSelectedSheetIndexes, sheetIndex)
                    } else {
                        removeIfPresent(newSelectedSheetIndexes, sheetIndex)
                    }
                })
                newSelectedSheetIndexes.sort() // Make sure these are in the right order;
                props.onChange(newSelectedSheetIndexes);
            }}
        >
            {props.sheetDataArray.map((sheetData, index) => {
                const dfName = sheetData.dfName;

                return (
                    <MultiToggleItem
                        key={index}
                        title={dfName}
                        toggled={selectedSheetIndexes.includes(index)}
                        index={index}
                        onToggle={() => { 
                            const newSheetIndexes = [...selectedSheetIndexes]
                            toggleInArray(newSheetIndexes, index); // Toggle the index
                            newSheetIndexes.sort() // Make sure these are in the right order;
                            props.onChange(newSheetIndexes);
                        }}
                    />
                ) 
            })}
        </MultiToggleBox>
    )
}

export default DataframeMultiSelect;
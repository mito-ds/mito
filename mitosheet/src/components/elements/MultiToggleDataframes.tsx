// Copyright (c) Mito
import React from 'react';
import { SheetData, UIState } from '../../types';
import { toggleInArray } from '../../utils/arrays';
import MultiToggleBox from './MultiToggleBox';
import MultiToggleItem from './MultiToggleItem';
import { Height } from './sizes.d';

interface MultiToggleDataframesProps {
    sheetDataArray: SheetData[];
    selectedSheetIndexes: number[];
    onChange: (newSelectedSheetIndexes: number[]) => void;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    height?: Height;
}

/**
 * The MultiToggleDataframe component allows the user to toggle and select multiple
 * different dataframes at once
 */
const MultiToggleDataframes = (props: MultiToggleDataframesProps): JSX.Element => {

    const selectedSheetIndexes = [...props.selectedSheetIndexes].sort()

    return (
        <MultiToggleBox
            width='block'
            height={props.height || 'small'}
            onToggleAll={(newIndexes) => {
                newIndexes.sort() // Make sure these are in the right order;
                props.onChange(newIndexes);
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

export default MultiToggleDataframes;
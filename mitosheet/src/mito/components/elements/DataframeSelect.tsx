// Copyright (c) Mito
import React, { useState } from 'react';

import { SheetData } from '../../types';
import Col from '../layout/Col';
import Row from '../layout/Row';
import DropdownItem from './DropdownItem';
import Select from './Select';

interface DataframeSelectPros {
    /** 
        * @param sheetDataArray - the sheet data to select from
    */
    sheetDataArray: SheetData[];

    /** 
        * @param sheetIndex - the sheet that is selected
    */
    sheetIndex: number;
    /**
        * @param onChange - Handles actually changing the value of the selected dataframe
    */
    onChange: (newSheetIndex: number) => void;
    /**
        * @param [title] - A title to display on this selection
    */
    title?: string;
    /**
        * @param [sheetIndexToIgnore] - If there is a sheets you don't want displayed in the dropdown, then pass it here
    */
    sheetIndexToIgnore?: number;

    /**
     * @param [span] - The span of the select -- 
     */
    span?: number;
}

/**
 * The DataframeSelect component is a commonly used component in taskpanes
 * that allows users to select which dataframe they want to operate on. It
 * comes with a label.
 */
const DataframeSelect = (props: DataframeSelectPros): JSX.Element => {

    // We only show the names that were initially used when this element is
    // rendered, as the dataframe selects never want to let users select
    // new sheets that have been created
    const [dfNames] = useState(() => props.sheetDataArray
        .map(sheetData => sheetData.dfName)
        .filter((dfName, sheetIndex) => {return sheetIndex !== props.sheetIndexToIgnore})
    );

    return (
        <Row justify='space-between' align='center' title={props.title}>
            <Col>
                <p className='text-header-3'>
                    Dataframe
                </p>
            </Col>
            <Col span={props.span}>
                <Select
                    width={props.span === undefined ? 'medium' : undefined}
                    value={dfNames[props.sheetIndex]}
                    onChange={(newDfName: string) => {
                        const newSheetIndex = dfNames.findIndex((dfName) => dfName === newDfName);
                        // Only callback on real changes
                        if (newSheetIndex !== -1 && newSheetIndex !== props.sheetIndex) {
                            props.onChange(newSheetIndex);
                        }
                    }}
                >
                    {dfNames.map(dfName => {
                        return (
                            <DropdownItem
                                key={dfName}
                                title={dfName}
                            />
                        )
                    })}
                </Select>
            </Col>
        </Row>
    )
}

export default DataframeSelect;
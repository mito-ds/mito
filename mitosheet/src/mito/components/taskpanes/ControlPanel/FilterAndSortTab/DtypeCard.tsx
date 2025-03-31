/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React, { useState } from 'react';
import { MitoAPI,  getRandomId } from '../../../../api/api';
import { ColumnID, StepType } from '../../../../types';
import DropdownItem from '../../../elements/DropdownItem';
import Select from '../../../elements/Select';
import Col from '../../../layout/Col';
import Row from '../../../layout/Row';

const DTYPE_DESCRIPTION = 'Changes the dtype of the selected column in the underlying dataframe.'

type DtypeCardProps = {
    selectedSheetIndex: number;
    columnID: ColumnID;
    columnDtype: string;
    mitoAPI: MitoAPI;
    // NOTE: we added the lastStepIndex as a props so that we know when
    // to refresh the dtype of the column in the case of an undo. We also
    // track if the last step is a delete, and don't refresh in that case
    // as the column will then not exist
    lastStepIndex: number;
    lastStepType: StepType;
}

// The dtypes accepted by the change column dtype change
export enum ColumnDtypes {
    BOOL = 'bool',
    INT = 'int',
    FLOAT = 'float',
    STRING = 'str',
    DATETIME = 'datetime',
    TIMEDELTA = 'timedelta',
}

/* 
    Given the raw dtype of the column (e.g. 'int64'), gets
    the dtype that will choosen in the value dropdown for
    that column.
*/
export function getDtypeValue(dtype: string | undefined): ColumnDtypes {
    if (dtype === undefined) {
        return ColumnDtypes.STRING;
    }

    if (dtype.includes('bool')) {
        return ColumnDtypes.BOOL;
    } else if (dtype.includes('int')) {
        return ColumnDtypes.INT;
    } else if (dtype.includes('float')) {
        return ColumnDtypes.FLOAT;
    } else if (dtype.includes('str') || dtype.includes('object')) {
        return ColumnDtypes.STRING;
    } else if (dtype.includes('datetime')) {
        return ColumnDtypes.DATETIME;
    } else if (dtype.includes('timedelta')) {
        return ColumnDtypes.TIMEDELTA;
    }

    return ColumnDtypes.STRING;
}

export function getDtypeSelectOptions(onChange?: (newDtype: string) => void): JSX.Element[] {

    // If you want to define an onClick directly, pass this onChange to the select options. This is necesary
    // if, like in the toolbar, we're creating a dropdown directly rather than a select

    return [
        <DropdownItem
            title={ColumnDtypes.BOOL}
            key={ColumnDtypes.BOOL}
            onClick={onChange ? () => {onChange(ColumnDtypes.BOOL)} : undefined}
        />,
        <DropdownItem
            title={ColumnDtypes.INT}
            key={ColumnDtypes.INT}
            hideSubtext
            displaySubtextOnHover
            onClick={onChange ? () => {onChange(ColumnDtypes.INT)} : undefined}
        />,
        <DropdownItem
            title={ColumnDtypes.FLOAT}
            key={ColumnDtypes.FLOAT}
            onClick={onChange ? () => {onChange(ColumnDtypes.FLOAT)} : undefined}

        />,
        <DropdownItem
            title={ColumnDtypes.STRING}
            key={ColumnDtypes.STRING}
            onClick={onChange ? () => {onChange(ColumnDtypes.STRING)} : undefined}
        />,
        <DropdownItem
            title={ColumnDtypes.DATETIME}
            key={ColumnDtypes.DATETIME}
            onClick={onChange ? () => {onChange(ColumnDtypes.DATETIME)} : undefined}
        />,
        <DropdownItem
            title={ColumnDtypes.TIMEDELTA}
            key={ColumnDtypes.TIMEDELTA}
            onClick={onChange ? () => {onChange(ColumnDtypes.TIMEDELTA)} : undefined}
        />
    ]
}

/*
    A card that allows a user to change the dtype of a column.
*/
function DtypeCard(props: DtypeCardProps): JSX.Element {
    const [stepID] = useState<string>(() => getRandomId());

    async function changeColumnDtype(newDtype: string) {
        await props.mitoAPI.editChangeColumnDtype(
            props.selectedSheetIndex,
            [props.columnID],
            newDtype,
            stepID
        )
    }

    return (  
        <> 
            <Row justify='space-between' align='center'>
                {/* NOTE: the spacing in the Dtype card should be the same as the SortCard */}
                <Col span={6} title={DTYPE_DESCRIPTION}>
                    <p className='text-header-3'> 
                        Dtype 
                    </p>
                </Col>
                <Col offset={2} flex='1'>
                    <Select
                        value={getDtypeValue(props.columnDtype)}
                        onChange={(newDtype: string) => {
                            void changeColumnDtype(newDtype);
                        }}
                        dropdownWidth='medium'
                    >
                        {getDtypeSelectOptions()}
                    </Select>
                </Col>
            </Row>
        </>
    );
}


export default DtypeCard;
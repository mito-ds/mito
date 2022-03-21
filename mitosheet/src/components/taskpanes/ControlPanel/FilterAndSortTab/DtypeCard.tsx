// Copyright (c) Mito

import React, { useState } from 'react';
import MitoAPI from '../../../../api';
import { ColumnID, StepType } from '../../../../types';
import DropdownItem from '../../../elements/DropdownItem';
import Select from '../../../elements/Select';
import Col from '../../../spacing/Col';
import Row from '../../../spacing/Row';

const DTYPE_DESCRIPTION = 'Changes the dtype of the selected column in the underlying dataframe.'

type DtypeCardProps = {
    selectedSheetIndex: number;
    columnID: ColumnID;
    columnFormula: string;
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
enum ColumnDtypes {
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

/*
    A card that allows a user to change the dtype of a column if it
    is a data column. If it is a formula column, just displays the 
    dtype.
*/
function DtypeCard(props: DtypeCardProps): JSX.Element {
    const [stepID, setStepID] = useState<string | undefined>(undefined);

    async function changeColumnDtype(newDtype: string) {
        const newStepID = await props.mitoAPI.editChangeColumnDtype(
            props.selectedSheetIndex,
            props.columnID,
            newDtype,
            stepID
        )
        setStepID(newStepID);
    }

    return (  
        <> 
            <Row justify='space-between' align='center'>
                {/* NOTE: the spacing in the Dtype card should be the same as the SortCard */}
                <Col span={4} title={DTYPE_DESCRIPTION}>
                    <p className='text-header-3'> 
                        Dtype 
                    </p>
                </Col>
                <Col offset={2} flex='1'>
                    {props.columnFormula === '' &&
                        <Select
                            value={getDtypeValue(props.columnDtype)}
                            onChange={(newDtype: string) => {
                                void changeColumnDtype(newDtype);
                            }}
                            dropdownWidth='medium'
                        >
                            <DropdownItem
                                title={ColumnDtypes.BOOL}
                            />
                            <DropdownItem
                                title={ColumnDtypes.INT}
                                subtext={'Casting to an int will turn all NaN values to 0.'}
                                hideSubtext
                                displaySubtextOnHover
                            />
                            <DropdownItem
                                title={ColumnDtypes.FLOAT}
                            />
                            <DropdownItem
                                title={ColumnDtypes.STRING}
                            />
                            <DropdownItem
                                title={ColumnDtypes.DATETIME}
                            />
                            <DropdownItem
                                title={ColumnDtypes.TIMEDELTA}
                            />
                        </Select>
                    }
                    {props.columnFormula !== '' &&
                        <p className='text-header-3 text-align-right'>
                            {getDtypeValue(props.columnDtype)}
                        </p>
                    }
                </Col>
            </Row>
            {props.columnFormula !== '' &&
                <Row>
                    <Col>
                        <p className='text-subtext-1'>
                            Edit the formula to DATEVALUE, VALUE, or TEXT to change the type.
                        </p>
                    </Col>
                </Row>
            }
        </>
    );
}


export default DtypeCard;
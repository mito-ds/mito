// Copyright (c) Mito

import React, { CSSProperties } from 'react';
import { CONDITIONS_WITH_NO_INPUT } from './filterConditions';
import Row from '../../../../layout/Row';
import Col from '../../../../layout/Col';
import Select from '../../../../elements/Select';
import XIcon from '../../../../icons/XIcon';
import {  FilterType, Operator} from '../../../../../types';
import DropdownItem from '../../../../elements/DropdownItem';
import { isDatetimeDtype } from '../../../../../utils/dtypes';
import { getFilterOptions } from './utils';


export function Filter(
    props: {
        first: boolean;
        filter: FilterType;
        operator: Operator;
        displayOperator: boolean;
        setFilter: (newFilter: FilterType) => void;
        setOperator: (operator: Operator) => void;
        deleteFilter: () => void;
        inGroup?: boolean;
        columnDtype: string | undefined; // Undefined displays all filter options!
    }): JSX.Element {

    // We hide the input if it is not necessary
    const inputStyle: CSSProperties = CONDITIONS_WITH_NO_INPUT.includes(props.filter.condition) ? {'visibility': 'hidden'} : {'visibility': 'visible'};


    const filterConditionOptions = getFilterOptions(props.columnDtype);

    return (
        <Row justify='space-between' align='center'>
            <Col span={!props.inGroup ? 4 : 5}>
                {props.first && 
                    <p className='text-body-1'>
                        Where
                    </p>
                }
                {!props.first && 
                    <Select
                        value={props.operator}
                        onChange={(newOperator: string) => props.setOperator(newOperator as Operator)}
                        dropdownWidth='small'
                    >
                        <DropdownItem
                            title='And'
                        />
                        <DropdownItem
                            title='Or'
                        />
                    </Select>
                }
            </Col>
            <Col span={7}>
                <Select
                    value={props.filter.condition}
                    onChange={(newFilterCondition: string) => {
                        props.setFilter({
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            condition: newFilterCondition as any,
                            value: props.filter.value
                        })
                    }}
                    width='block'
                    dropdownWidth='medium'
                >
                    {filterConditionOptions}
                </Select>
            </Col>
            <Col span={9}>
                <input 
                    className='mito-input element-width-block'
                    style={inputStyle}
                    type={props.columnDtype && isDatetimeDtype(props.columnDtype) ? 'date' : 'text'}
                    value={props.filter.value} 
                    onChange={e => {
                        props.setFilter({
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            condition: props.filter.condition as any,
                            value: e.target.value
                        })
                    }}
                />
            </Col>
            <Col>
                <XIcon onClick={props.deleteFilter}/>
            </Col>
        </Row>
    )
}
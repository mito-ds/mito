// Copyright (c) Mito

import React, { CSSProperties } from 'react';
import { CONDITIONS_WITH_NO_INPUT, DATETIME_SELECT_OPTIONS } from './filterConditions';
import Row from '../../../../layout/Row';
import Col from '../../../../layout/Col';
import Select from '../../../../elements/Select';
import XIcon from '../../../../icons/XIcon';
import {  DatetimeFilterCondition, FilterType, Operator} from '../../../../../types';
import DropdownItem from '../../../../elements/DropdownItem';
import { isDatetimeDtype } from '../../../../../utils/dtypes';
import { getFilterOptions } from './filterUtils';


export function Filter(
    props: {
        filter: FilterType;
        operator: Operator;
        displayOperator: boolean;
        setFilter: (newFilter: FilterType) => void;
        setOperator?: (operator: Operator) => void;
        deleteFilter?: () => void;
        inGroup?: boolean;
        columnDtype: string | undefined; // Undefined displays all filter options!
        nameLength: 'long_name' | 'short_name',
        suppressTopBottomMargin?: boolean;
    }): JSX.Element {

    // We hide the input if it is not necessary
    const inputStyle: CSSProperties = CONDITIONS_WITH_NO_INPUT.includes(props.filter.condition) ? {'visibility': 'hidden'} : {'visibility': 'visible'};


    const filterConditionOptions = getFilterOptions(props.columnDtype, props.nameLength);
    const setOperator = props.setOperator;

    const isDatetime = (props.columnDtype && isDatetimeDtype(props.columnDtype)) ||
        (props.columnDtype === undefined && DATETIME_SELECT_OPTIONS[props.filter.condition as DatetimeFilterCondition] !== undefined)

    return (
        <Row justify='space-between' align='center' suppressTopBottomMargin={props.suppressTopBottomMargin}>
            <Col span={5}>
                {setOperator === undefined && 
                    <p className='text-body-1'>
                        Where
                    </p>
                }
                {setOperator !== undefined && 
                    <Select
                        value={props.operator}
                        onChange={(newOperator: string) => setOperator(newOperator as Operator)}
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
                    dropdownWidth={
                        props.nameLength == 'long_name' ? 'medium-large' : 'medium'
                    }
                >
                    {filterConditionOptions}
                </Select>
            </Col>
            <Col span={9}>
                <input 
                    className='mito-input element-width-block'
                    style={inputStyle}
                    type={isDatetime ? 'date' : 'text'}
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
            {props.deleteFilter &&
                <Col>
                    <XIcon onClick={props.deleteFilter}/>
                </Col>
            }
        </Row>
    )
}
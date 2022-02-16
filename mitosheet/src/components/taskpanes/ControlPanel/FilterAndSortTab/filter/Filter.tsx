// Copyright (c) Mito

import React, { CSSProperties } from 'react';
import { BOOLEAN_SELECT_OPTIONS, CONDITIONS_WITH_NO_INPUT, DATETIME_SELECT_OPTIONS, NUMBER_SELECT_OPTIONS, STRING_SELECT_OPTIONS } from './filterConditions';
import Row from '../../../../spacing/Row';
import Col from '../../../../spacing/Col';
import Select from '../../../../elements/Select';
import XIcon from '../../../../icons/XIcon';
import { FilterType, Operator } from '../../../../../types';
import DropdownItem from '../../../../elements/DropdownItem';
import { isBoolDtype, isDatetimeDtype, isNumberDtype } from '../../../../../utils/dtypes';


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
        columnDtype: string;
    }): JSX.Element {

    // We hide the input if it is not necessary
    const inputStyle: CSSProperties = CONDITIONS_WITH_NO_INPUT.includes(props.filter.condition) ? {'visibility': 'hidden'} : {'visibility': 'visible'};
    console.log(props.columnDtype)
    const getFilterOptions = (): JSX.Element[] => {
        if (isNumberDtype(props.columnDtype)) {
            return Object.entries(NUMBER_SELECT_OPTIONS).map(([filterCondition, displayFilterCondition]) => {
                return (
                    <DropdownItem
                        key={filterCondition}
                        id={filterCondition}
                        title={displayFilterCondition}
                    />
                )
            });
        } else if (isBoolDtype(props.columnDtype)) {
            return Object.entries(BOOLEAN_SELECT_OPTIONS).map(([filterCondition, displayFilterCondition]) => {
                return (
                    <DropdownItem
                        key={filterCondition}
                        id={filterCondition}
                        title={displayFilterCondition}
                    />
                )
            })
        } else if (isDatetimeDtype(props.columnDtype)) {
            return Object.entries(DATETIME_SELECT_OPTIONS).map(([filterCondition, displayFilterCondition]) => {
                return (
                    <DropdownItem
                        key={filterCondition}
                        id={filterCondition}
                        title={displayFilterCondition}
                    />
                )
            })
        }

        return Object.entries(STRING_SELECT_OPTIONS).map(([filterCondition, displayFilterCondition]) => {
            return (
                <DropdownItem
                    key={filterCondition}
                    id={filterCondition}
                    title={displayFilterCondition}
                />
            )
        })
    }

    const filterConditionOptions = getFilterOptions();

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
                    className='input element-width-block'
                    style={inputStyle}
                    type={isDatetimeDtype(props.columnDtype) ? 'date' : 'text'}
                    value={props.filter.value} 
                    onChange={e => {
                        props.setFilter({
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
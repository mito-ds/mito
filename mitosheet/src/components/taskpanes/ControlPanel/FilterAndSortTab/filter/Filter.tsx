// Copyright (c) Mito

import React, { CSSProperties } from 'react';
import { COLUMN_TYPE_TO_SELECT_OPTIONS, CONDITIONS_WITH_NO_INPUT } from './filterConditions';
import Row from '../../../../spacing/Row';
import Col from '../../../../spacing/Col';
import Select from '../../../../elements/Select';
import XIcon from '../../../../icons/XIcon';
import { ColumnMitoType, FilterType, Operator } from '../../../../../types';
import DropdownItem from '../../../../elements/DropdownItem';

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
    }): JSX.Element {

    // We hide the input if it is not necessary
    const inputStyle: CSSProperties = CONDITIONS_WITH_NO_INPUT.includes(props.filter.condition) ? {'visibility': 'hidden'} : {'visibility': 'visible'};

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
                            type: props.filter.type as any,
                            condition: newFilterCondition as any,
                            value: props.filter.value
                        })
                    }}
                    width='block'
                    dropdownWidth='medium'
                >
                    {Object.entries(COLUMN_TYPE_TO_SELECT_OPTIONS[props.filter.type]).map(([filterCondition, displayFilterCondition]) => {
                        return (
                            <DropdownItem
                                key={filterCondition}
                                id={filterCondition}
                                title={displayFilterCondition}
                            />
                        )
                    })}
                </Select>
            </Col>
            <Col span={9}>
                <input 
                    className='input element-width-block'
                    style={inputStyle}
                    type={props.filter.type === ColumnMitoType.DATETIME_SERIES ? 'date' : 'text'}
                    value={props.filter.value} 
                    onChange={e => {
                        props.setFilter({
                            type: props.filter.type as any,
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
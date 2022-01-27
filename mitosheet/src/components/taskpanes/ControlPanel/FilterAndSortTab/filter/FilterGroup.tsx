import React from 'react';
import { Filter } from './Filter';

import TextButton from '../../../../elements/TextButton';
import { FilterType, Operator } from '../../../../../types';

/* 
    Component that contains a group of filters
*/
export default function FilterGroup(
    props: {
        mainOperator: Operator;
        filters: FilterType[],
        groupOperator: Operator;
        setFilter: (filterIndex: number, newFilter: FilterType) => void;
        setOperator: (operator: Operator) => void;
        deleteFilter: (filterIndex: number) => void;
        addFilter: () => void;
    }): JSX.Element {
    
    return (
        <div className="filter-group">
            {props.filters.map((filter, index) => {
                return (
                    <Filter
                        first={index === 0}
                        key={index}
                        filter={filter}
                        operator={props.groupOperator}
                        displayOperator
                        setFilter={(newFilter) => {
                            props.setFilter(index, newFilter);
                        }}
                        setOperator={props.setOperator}
                        deleteFilter={() => {props.deleteFilter(index)}}
                        inGroup
                    />
                )
            })}
            <TextButton 
                variant='light' 
                onClick={props.addFilter}
                width='medium'
            >
                + Add a Filter
            </TextButton>
        </div>
    )
}
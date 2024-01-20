// Copyright (c) Mito

import React from 'react';
import { MitoAPI } from '../../../../../api/api';
import { isFilterGroup } from './filterTypes';
import { Filter } from './Filter';
import FilterGroup from './FilterGroup';
import DropdownButton from '../../../../elements/DropdownButton';
import Select from '../../../../elements/Select';
import Row from '../../../../layout/Row';
import Col from '../../../../layout/Col';
import '../../../../../../css/taskpanes/ControlPanel/FilterCard.css';
import { FilterType, Operator, FilterGroupType, ColumnID } from '../../../../../types';
import DropdownItem from '../../../../elements/DropdownItem';
import { getEmptyFilterData } from './filterUtils';


interface FilterCardProps {
    filters: (FilterType | FilterGroupType)[];
    operator: Operator;
    setFilters: React.Dispatch<React.SetStateAction<(FilterType | FilterGroupType)[]>>;
    setOperator: React.Dispatch<React.SetStateAction<Operator>>;
    selectedSheetIndex: number;
    columnID: ColumnID;
    columnDtype: string;
    mitoAPI: MitoAPI;
    rowDifference: number;
    editedFilter: boolean;
}

export const ADD_FILTER_SELECT_TITLE = '+ Add Filter'

/* 
    Component that contains all that one needs to filter!
*/
function FilterCard (props: FilterCardProps): JSX.Element {

    /* 
        Adds a new, blank filter to the end of the filters list
    */
    const addFilter = (): void => {
        props.setFilters((prevFilters) => {
            const newFilters = [...prevFilters];
            newFilters.push(getEmptyFilterData(props.columnDtype));
            return newFilters;
        })
    }

    /* 
        Creates a new filter group (at the bottom) with a single empty
        filter
    */
    const addFilterGroup = (): void => {
        props.setFilters((prevFilters) => {
            const newFilters = [...prevFilters];
            newFilters.push(
                {
                    filters: [
                        getEmptyFilterData(props.columnDtype)
                    ],
                    operator: 'And'
                }
            )
            return newFilters;
        })
    }

    /* 
        Adds a blank new filter to the end of a specific group
    */
    const addFilterToGroup = (groupIndex: number): void => {
        props.setFilters((prevFilters) => {
            const newFilters = [...prevFilters];
            const filterGroup = newFilters[groupIndex];
            if (isFilterGroup(filterGroup)) {
                // If we do have a filter group at that groupIndex, then we add a new filter to it
                filterGroup.filters.push(
                    getEmptyFilterData(props.columnDtype)
                );
                return newFilters;
            } else {
                // We make no changes if this was not a filter group, which should never occur
                return prevFilters;
            }
        })
    }


    /* 
        Deletes a filter that is at the given index in the main
        filter list.
    */
    const deleteFilter = (filterIndex: number): void => {
        props.setFilters((prevFilters) => {
            const newFilters = [...prevFilters];
            newFilters.splice(filterIndex, 1)
            return newFilters;
        })
    }

    /* 
        Deletes a filter that is at a given index in filter list
        of a specific filter group
    */
    const deleteFilterFromGroup = (groupIndex: number, filterIndex: number): void => {
        props.setFilters((prevFilters) => {
            const newFilters = [...prevFilters];
            const filterGroup = newFilters[groupIndex];
            if (isFilterGroup(filterGroup)) {
                // If we do have a filter group at that groupIndex, then we delete the filter
                // at the passed filterIndex
                filterGroup.filters.splice(filterIndex, 1);  
                
                // If there are no filters left in this group, then we remove the entire group
                if (filterGroup.filters.length === 0) {
                    newFilters.splice(groupIndex, 1);
                }
                
                return newFilters
            } else {
                // We make no changes if this was not a filter group, which should never occur
                return prevFilters;
            }
        })
    }

    /*
        Sets a filter at the given index to the new filter value
    */
    const setFilter = (filterIndex: number, filter: FilterType): void => {
        props.setFilters((prevFilters) => {
            const newFilters = [...prevFilters];
            newFilters[filterIndex] = filter;
            return newFilters
        })
    }

    /*
        Sets a filter at the given filterIndex in the specific group at the given
        groupIndex to the new filter value
    */
    const setFilterInGroup = (groupIndex: number, filterIndex: number, filter: FilterType): void => {
        props.setFilters((prevFilters) => {
            const newFilters = [...prevFilters];
            const filterGroup = newFilters[groupIndex];
            if (isFilterGroup(filterGroup)) {
                filterGroup.filters[filterIndex] = filter;
                return newFilters;
            } else {
                // We make no changes if this was not a filter group, which should never occur
                return prevFilters;
            }
        })
    }

    
    /*
        Sets the operator that combines a specific filter group
    */
    const setOperatorInGroup = (groupIndex: number, operator: Operator): void => {
        props.setFilters((prevFilters) => {
            const newFilters = [...prevFilters];
            const filterGroup = newFilters[groupIndex];
            if (isFilterGroup(filterGroup)) {
                filterGroup.operator = operator;
                return newFilters;
            } else {
                // We make no changes if this was not a filter group, which should never occur
                return prevFilters;
            }
        })
    }

    return (
        <div>
            <div className='text-header-3 mt-15px'>
                <p> Filter </p>
            </div>
            {props.filters.map((filterOrGroup, index) => {
                if (isFilterGroup(filterOrGroup)) {
                    return (
                        /* 
                            If the FilterGroup is the first Filter or FilterGroup
                            in the FilterCard, add a 'Where'
                        */
                        <Row justify='space-between' align='top'>
                            <Col span={4}>
                                {index === 0 &&
                                    <p className='text-body-1'>
                                        Where
                                    </p>
                                }
                                {index !== 0 && 
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
                            <Col span={19}>
                                <FilterGroup
                                    key={index}
                                    mainOperator={props.operator}
                                    filters={filterOrGroup.filters}
                                    groupOperator={filterOrGroup.operator}
                                    setFilter={(filterIndex, newFilter) => {
                                        setFilterInGroup(index, filterIndex, newFilter);
                                    }}
                                    setOperator={(newOperator) => {
                                        setOperatorInGroup(index, newOperator);
                                    }}
                                    deleteFilter={(filterIndex: number) => {
                                        deleteFilterFromGroup(index, filterIndex);
                                    }}
                                    addFilter={() => addFilterToGroup(index)}
                                    columnDtype={props.columnDtype}
                                />
                            </Col>
                        </Row>
                    );
                } else {
                    return (
                        <Filter
                            key={index}
                            filter={filterOrGroup}
                            operator={props.operator}
                            displayOperator
                            setFilter={(newFilter) => {
                                setFilter(index, newFilter)
                            }}
                            setOperator={index === 0 ? undefined : props.setOperator}
                            deleteFilter={() => {deleteFilter(index)}}
                            columnDtype={props.columnDtype}
                            nameLength='short_name'
                        />
                    );
                }
            })}
            <DropdownButton
                text={ADD_FILTER_SELECT_TITLE}
                width='medium'
                dropdownWidth='medium'
            >
                <DropdownItem
                    title='Add a Filter'
                    onClick={addFilter}
                />
                <DropdownItem
                    title='Add a Group of Filters'
                    onClick={addFilterGroup}
                />
            </DropdownButton>
            {props.editedFilter && 
                <Row className='text-subtext-1'>
                    {props.rowDifference >= 0 ?
                        `Removed an additional ${Math.abs(props.rowDifference)} rows` : 
                        `Added back ${Math.abs(props.rowDifference)} rows`
                    }
                </Row>
            }
        </div>
    )
}

export default FilterCard;
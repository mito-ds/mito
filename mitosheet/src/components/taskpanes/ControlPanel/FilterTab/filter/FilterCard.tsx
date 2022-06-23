// Copyright (c) Mito

import React, { useState } from 'react';
import MitoAPI from '../../../../../jupyter/api';
import { isFilterGroup } from './filterTypes';
import { Filter } from './Filter';
import FilterGroup from './FilterGroup';
import DropdownButton from '../../../../elements/DropdownButton';
import Select from '../../../../elements/Select';
import Row from '../../../../spacing/Row';
import Col from '../../../../spacing/Col';
import { FilterType, Operator, FilterGroupType, ColumnID, ColumnFilters, SheetData, AnalysisData, StepType } from '../../../../../types';
import DropdownItem from '../../../../elements/DropdownItem';
import { getEmptyFilterData, getFilterDisabledMessage, isValidFilter, parseFilter } from './utils';
import useLiveUpdatingParams from '../../../../../hooks/useLiveUpdatingParams';


interface FilterCardProps {
    mitoAPI: MitoAPI;
    sheetData: SheetData;
    selectedSheetIndex: number;
    columnID: ColumnID;
    columnDtype: string;
    columnFilters: ColumnFilters;
    analysisData: AnalysisData;
}

export const ADD_FILTER_SELECT_TITLE = '+ Add Filter'
const FILTER_MESSAGE_DELAY = 500;

export interface FilterParams {
    sheet_index: number;
    column_id: string;
    operator: Operator;
    filters: (FilterType | FilterGroupType)[];
}




/* 
    Component that contains all that one needs to filter!
*/
function FilterCard (props: FilterCardProps): JSX.Element {

    
    const {params, setParams, editApplied} = useLiveUpdatingParams<FilterParams>(
        {
            sheet_index: props.selectedSheetIndex,
            column_id: props.columnID,
            filters: props.columnFilters !== undefined ? props.columnFilters.filter_list.filters : [],
            operator: props.columnFilters !== undefined ? props.columnFilters.filter_list.operator : 'And'
        },
        StepType.FilterColumn,
        props.mitoAPI, props.analysisData, FILTER_MESSAGE_DELAY, 
        (params) => {
            // To handle decimals, we allow decimals to be submitted, and then just
            // parse them before they are sent to the back-end
            const parsedFilters: (FilterType | FilterGroupType)[] = params.filters.map((filterOrGroup): FilterType | FilterGroupType => {
                if (isFilterGroup(filterOrGroup)) {
                    return {
                        filters: filterOrGroup.filters.map((filter) => {
                            return parseFilter(filter, props.columnDtype);
                        }),
                        operator: filterOrGroup.operator
                    }
                } else {
                    return parseFilter(filterOrGroup, props.columnDtype)
                }
            })

            const filtersToApply: (FilterType | FilterGroupType)[] = parsedFilters.map((filterOrGroup): FilterType | FilterGroupType => {
                // Filter out these incomplete filters from the group
                if (isFilterGroup(filterOrGroup)) {
                    return {
                        filters: filterOrGroup.filters.filter((filter) => {
                            return isValidFilter(filter, props.columnDtype)
                        }),
                        operator: filterOrGroup.operator
                    }
                } else {
                    return filterOrGroup
                }
            }).filter((filterOrGroup) => {
                // Filter out the groups if they have no valid filters in them
                if (isFilterGroup(filterOrGroup)) {
                    return filterOrGroup.filters.length > 0;
                }
                // And then we filter the non group filters to be non-empty
                return isValidFilter(filterOrGroup, props.columnDtype)
            });

            return {
                ...params,
                filters: filtersToApply
            }
        }
    )

    if (params === undefined) {
        return <></>
    }

    const [originalNumRows, ] = useState(props.sheetData?.numRows || 0)

    /* 
        Adds a new, blank filter to the end of the filters list
    */
    const addFilter = (): void => {
        setParams(prevParams => {
            const newFilters = [...prevParams.filters];
            newFilters.push(getEmptyFilterData(props.columnDtype));
            
            return {
                ...prevParams,
                filters: newFilters
            }
        })
    }

    /* 
        Creates a new filter group (at the bottom) with a single empty
        filter
    */
    const addFilterGroup = (): void => {
        setParams(prevParams => {
            const newFilters = [...prevParams.filters];
            newFilters.push(
                {
                    filters: [
                        getEmptyFilterData(props.columnDtype)
                    ],
                    operator: 'And'
                }
            )
            
            return {
                ...prevParams,
                filters: newFilters
            }
        })
    }

    /* 
        Adds a blank new filter to the end of a specific group
    */
    const addFilterToGroup = (groupIndex: number): void => {
        setParams(prevParams => {
            const newFilters = [...prevParams.filters];
            const filterGroup = newFilters[groupIndex];
            if (isFilterGroup(filterGroup)) {
                // If we do have a filter group at that groupIndex, then we add a new filter to it
                filterGroup.filters.push(
                    getEmptyFilterData(props.columnDtype)
                );
                return {
                    ...prevParams,
                    filters: newFilters
                };
            } else {
                // We make no changes if this was not a filter group, which should never occur
                return prevParams;
            }            
        })
    }


    /* 
        Deletes a filter that is at the given index in the main
        filter list.
    */
    const deleteFilter = (filterIndex: number): void => {
        setParams(prevParams => {
            const newFilters = [...prevParams.filters];
            newFilters.splice(filterIndex, 1)
        
            return {
                ...prevParams,
                filters: newFilters
            }
        })
    }

    /* 
        Deletes a filter that is at a given index in filter list
        of a specific filter group
    */
    const deleteFilterFromGroup = (groupIndex: number, filterIndex: number): void => {
        setParams(prevParams => {
            const newFilters = [...prevParams.filters];
            const filterGroup = newFilters[groupIndex];
            if (isFilterGroup(filterGroup)) {
                // If we do have a filter group at that groupIndex, then we delete the filter
                // at the passed filterIndex
                filterGroup.filters.splice(filterIndex, 1);  
                
                // If there are no filters left in this group, then we remove the entire group
                if (filterGroup.filters.length === 0) {
                    newFilters.splice(groupIndex, 1);
                }
                
                return {
                    ...prevParams,
                    filters: newFilters
                }
            } else {
                // We make no changes if this was not a filter group, which should never occur
                return prevParams;
            }        
        })
    }

    /*
        Sets a filter at the given index to the new filter value
    */
    const setFilter = (filterIndex: number, filter: FilterType): void => {
        setParams(prevParams => {
            const newFilters = [...prevParams.filters];
            newFilters[filterIndex] = filter;
        
            return {
                ...prevParams,
                filters: newFilters
            }
        })
    }

    /*
        Sets a filter at the given filterIndex in the specific group at the given
        groupIndex to the new filter value
    */
    const setFilterInGroup = (groupIndex: number, filterIndex: number, filter: FilterType): void => {
        setParams(prevParams => {
            const newFilters = [...prevParams.filters];
            const filterGroup = newFilters[groupIndex];
            if (isFilterGroup(filterGroup)) {
                filterGroup.filters[filterIndex] = filter;
                return {
                    ...prevParams,
                    filters: newFilters
                };
            } else {
                // We make no changes if this was not a filter group, which should never occur
                return prevParams;
            }        
        })
    }

    const setOperator = (newOperator: Operator): void => {
        setParams(prevParams => {
            return {
                ...prevParams,
                operator: newOperator as Operator
            }
        })
    }

    
    /*
        Sets the operator that combines a specific filter group
    */
    const setOperatorInGroup = (groupIndex: number, operator: Operator): void => {
        setParams(prevParams => {
            const filterGroup = prevParams.filters[groupIndex];
            if (isFilterGroup(filterGroup)) {
                filterGroup.operator = operator;
                return {
                    ...prevParams,
                    operator: operator
                };
            } else {
                // We make no changes if this was not a filter group, which should never occur
                return prevParams;
            }        
        })
    }

    const rowDifference = originalNumRows - (props.sheetData?.numRows || 0)
    const disabledMessage = getFilterDisabledMessage(props.columnDtype);

    return (
        <div>
            <Row justify='space-between'>
                <Col>
                    <div className='text-header-2'>
                        <p> Filter </p>
                    </div>
                </Col>
                <Col>
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
                </Col>
            </Row>
            {disabledMessage !== undefined && 
                <p className='text-subtext-1 mt-5px'>{disabledMessage}</p>
            }
            {disabledMessage === undefined &&
                <>
                    {params.filters.map((filterOrGroup, index) => {
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
                                                value={params.operator}
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
                                    <Col span={19}>
                                        <FilterGroup
                                            key={index}
                                            mainOperator={params.operator}
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
                                    first={index === 0}
                                    key={index}
                                    filter={filterOrGroup}
                                    operator={params.operator}
                                    displayOperator
                                    setFilter={(newFilter) => {
                                        setFilter(index, newFilter)
                                    }}
                                    setOperator={setOperator}
                                    deleteFilter={() => {deleteFilter(index)}}
                                    columnDtype={props.columnDtype}
                                />
                            );
                        }
                    })}
                    {editApplied && 
                        <Row className='text-subtext-1'>
                            {rowDifference >= 0 ?
                                `Removed an additional ${Math.abs(rowDifference)} rows` : 
                                `Added back ${Math.abs(rowDifference)} rows`
                            }
                        </Row>
                    }
                </>
            }
        </div>
    )
}

export default FilterCard;
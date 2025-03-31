/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import React, { Fragment, useRef, useState } from 'react';
import { MitoAPI } from '../../../../api/api';
import MultiToggleBox from '../../../elements/MultiToggleBox';
import Select from '../../../elements/Select';
import { FilterType, FilterGroupType, ColumnID, UIState, ColumnFormatType } from '../../../../types';
import Col from '../../../layout/Col';
import Row from '../../../layout/Row';
import { areFiltersEqual, getAllDoesNotContainsFilterValues, getExclusiveFilterData, getFilterDisabledMessage } from '../FilterAndSortTab/filter/filterUtils';
import MultiToggleItem from '../../../elements/MultiToggleItem';
import DropdownItem from '../../../elements/DropdownItem';
import { useDebouncedEffect } from '../../../../hooks/useDebouncedEffect';
import { isFilterGroup } from '../FilterAndSortTab/filter/filterTypes';
import { formatCellData } from '../../../../utils/format';
import OpenFillNaN from '../../FillNa/OpenFillNaN';

/*
    The UniqueValueCount datatype contains all of the necessary data
    for each entry in the value section. It is responsible for holding
    information about itself that is used for determining how to display
    the unique value count in the MultiToggleBox
*/
export interface UniqueValueCount {
    value: string | number | boolean, // the value in the column
    percentOccurence: number, // the percent of rows in the column that are value
    countOccurence: number
    isNotFiltered: boolean, // true if the user has not filtered out the unique value count from their data through the value section
}


export enum UniqueValueSortType {
    ASCENDING_ALPHABETICAL = 'Ascending Value',
    DESCENDING_ALPHABETICAL = 'Descending Value',
    ASCENDING_PERCENT_OCCURENCE = 'Ascending Occurence',
    DESCENDING_PERCENT_OCCURENCE = 'Descending Occurence',
}


const sortUniqueValueCounts = (uniqueValueCounts: UniqueValueCount[], uniqueValueSortType: UniqueValueSortType): UniqueValueCount[] => {
    if (uniqueValueSortType === UniqueValueSortType.ASCENDING_ALPHABETICAL) {
        return uniqueValueCounts.sort(function(a, b) {
            if(a.value < b.value) { return -1; }
            if(a.value > b.value) { return 1; }
            return 0;
        })
    } else if (uniqueValueSortType === UniqueValueSortType.DESCENDING_ALPHABETICAL) {
        return uniqueValueCounts.sort(function(a, b) {
            if(a.value > b.value) { return -1; }
            if(a.value < b.value) { return 1; }
            return 0;
        })
    } else if (uniqueValueSortType === UniqueValueSortType.ASCENDING_PERCENT_OCCURENCE) {
        return uniqueValueCounts.sort(function(a, b) {
            return a.percentOccurence - b.percentOccurence
        });
    } else {
        return uniqueValueCounts.sort(function(a, b) {
            return b.percentOccurence - a.percentOccurence
        });
    }
}

export function ValuesTab(
    props: {
        selectedSheetIndex: number, 
        columnID: ColumnID,
        mitoAPI: MitoAPI;
        filters: (FilterType | FilterGroupType)[];
        setFilters: React.Dispatch<React.SetStateAction<(FilterType | FilterGroupType)[]>>;
        columnDtype: string,
        columnFormat: ColumnFormatType | undefined
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    }): JSX.Element {

    const [loading, setLoading] = useState(true);

    const [isAllData, setIsAllData] = useState(false); // Start false, so we go get the data in the start
    const [uniqueValueCounts, setUniqueValueCounts] = useState<UniqueValueCount[]>([])

    const [searchString, setSearchString] = useState('');
    const [sort, setSort] = useState<UniqueValueSortType>(UniqueValueSortType.ASCENDING_ALPHABETICAL)

    /**
     * In the past, we used to send all the unique values to the front-end
     * at once, but for large data-sets this pretty much crashed the page. 
     * 
     * Now, we only send the first 1000 values (with that sort, and search),
     * and then let the front-end further process them. Note that this means
     * that we sort and filter and both the front-end and backend, to give
     * the user the most responsive possible experience.
     * 
     * We reload data from the backend under the following conditions:
     * 1. We do not have all the data, and the search or sort changes
     * 2. We do have all the data, and the search is made more inclusive
     */
    const lastSearchTerm = useRef('so it rerenders the first time');
    const lastSort = useRef(sort)
    useDebouncedEffect(() => {
        if (
            !isAllData ||
            (isAllData && 
                ((!searchString.startsWith(lastSearchTerm.current)) || (searchString.length < lastSearchTerm.current.length))
            )
        ) {
            void loadUniqueValueCounts();
        }

        lastSearchTerm.current = searchString;
        lastSort.current = sort;
    }, [searchString, sort], 500);

    async function loadUniqueValueCounts() {
        setLoading(true);

        const response = await props.mitoAPI.getUniqueValueCounts(
            props.selectedSheetIndex,
            props.columnID,
            searchString,
            sort
        );
        const uniqueValueCountsObj = 'error' in response ? undefined : response.result;

        if (uniqueValueCountsObj === undefined) {
            setUniqueValueCounts([])
            setLoading(false);
            return undefined;
        }

        const uniqueValueCounts: UniqueValueCount[] = [];
        for (let i = 0; i < uniqueValueCountsObj.uniqueValueRowDataArray.length; i++) {
            uniqueValueCounts.push({
                value: uniqueValueCountsObj.uniqueValueRowDataArray[i][0],
                percentOccurence: (uniqueValueCountsObj.uniqueValueRowDataArray[i][1] as number) * 100,
                countOccurence: (uniqueValueCountsObj.uniqueValueRowDataArray[i][2] as number),
                isNotFiltered: true
            })
        }

        /*  
            Add back all of the values that were filtered out of the column, so the user can toggle
            them back on. Note that this lets users toggle them back on even if they were removed in a previous step! 
        */ 
        const allDoesNotContainsFilters: (string | number | boolean)[] = getAllDoesNotContainsFilterValues(props.filters, props.columnDtype)
        allDoesNotContainsFilters.forEach(key => {
            uniqueValueCounts.push({
                value: key,
                percentOccurence: 0,
                countOccurence: 0,
                isNotFiltered: false,
            })
        })
    
        setUniqueValueCounts(uniqueValueCounts);
        setIsAllData(uniqueValueCountsObj.isAllData);

        setLoading(false);
    }


    /* 
        Helper function for getting the index of the UniqueValueCount in UniqueValueCounts from the index 
        of the UniqueValueCount in the searchedUniqueValueCounts. It exploits the invariant that
        these are _unique value_ counts. 
    */
    const getUniqueValueCountIndexFromSortedIndex = (index: number): number => {
        const value = sortedUniqueValueCounts[index].value
        return uniqueValueCounts.findIndex(uniqueValueCount => {
            return uniqueValueCount.value === value
        })
    }

    /*
        Toggles the exclusive filter for a specific value. An exclusive filter is the NOT_EXACTLY filter condition
        for strings, numbers, and dates. For booleans its either the IS_TRUE or IS_FALSE conditions. 

        For a specific value in this column, the toggleExclusiveFilter determines if there is an exclusive filter that is excluding the value.
        If there is, it removes it. If there's is not, it applies it. 
    */
    const toggleExclusiveFilters = (values: (string | number | boolean)[]): void => {
        // Generate the filter
        
        props.setFilters((prevFilters) => {
            let newFilters = [...prevFilters];

            values.forEach(value => {
                const exclusiveFilter = getExclusiveFilterData(props.columnDtype, value)
                const originalFilterLength = newFilters.length

                // Remove the filter if it exists
                newFilters = newFilters.filter(filter => {
                    return isFilterGroup(filter) || !areFiltersEqual(filter, exclusiveFilter)
                })

                // If the filter didn't exist, then add it. 
                if (newFilters.length === originalFilterLength) {
                    newFilters.push(exclusiveFilter)
                }
            })

            return newFilters;
        })
    }

    const sortedUniqueValueCounts = sortUniqueValueCounts(uniqueValueCounts, sort);
    const disabledMessage = getFilterDisabledMessage(props.columnDtype);

    return (
        <Fragment>
            <Row justify='space-between'>
                <Col flex='1' offsetRight={1}>
                    <p className='text-header-2'> 
                        Values
                    </p>
                </Col>
                <Col>
                    <Select
                        value={sort}
                        onChange={(newSortType: string) => {
                            setSort(newSortType as UniqueValueSortType)
                        }}
                        width='medium'
                        dropdownWidth='medium'
                    >
                        {Object.values(UniqueValueSortType).map(sortType => {
                            return (
                                <DropdownItem
                                    key={sortType}
                                    title={sortType}
                                />
                            )
                        })}
                    </Select>
                </Col>
            </Row>
            {/* A little hack to get the multi-toggle box to not be too big */}
            <div style={{height: 'calc(100% - 40px)'}}>
                <MultiToggleBox 
                    loading={loading}
                    searchable
                    searchState={{
                        searchString: searchString,
                        setSearchString: setSearchString
                    }}
                    isSubset={!isAllData}
                    message={disabledMessage}
                    disabled={disabledMessage !== undefined}
                >
                    {sortedUniqueValueCounts.map((uniqueValueCount, index) => {
                        const valueToDisplay = formatCellData(uniqueValueCount.value, props.columnDtype, props.columnFormat);

                        /**
                         * If this is an NaN value, we display additional text that allows the user to navigate
                         * to the fill NaN taskpane easily
                         */
                        if (valueToDisplay === 'NaN') {
                            return (<MultiToggleItem
                                key={index}
                                title={
                                    <span>{valueToDisplay} <OpenFillNaN setUIState={props.setUIState} columnID={props.columnID}/></span>
                                }
                                rightText={uniqueValueCount.countOccurence + ' (' + uniqueValueCount.percentOccurence.toFixed(2).toString() + '%' + ')'}
                                rightTextSpan={7}
                                toggled={uniqueValueCount.isNotFiltered}
                                index={index}
                                onToggle={() => {

                                    // Manually change the toggle status so it updates instantaneously
                                    const uniqueValueCountIndex = getUniqueValueCountIndexFromSortedIndex(index);
                                    setUniqueValueCounts(oldUniqueValueCounts => {
                                        const newUniqueValueCounts = oldUniqueValueCounts.slice();
                                        newUniqueValueCounts[uniqueValueCountIndex].isNotFiltered = !uniqueValueCounts[uniqueValueCountIndex].isNotFiltered
                                        return newUniqueValueCounts;
                                    })

                                    toggleExclusiveFilters([uniqueValueCount.value])
                                }}
                            />)
                        }


                        return((
                            <MultiToggleItem
                                key={index}
                                title={valueToDisplay}
                                rightText={uniqueValueCount.countOccurence + ' (' + uniqueValueCount.percentOccurence.toFixed(2).toString() + '%' + ')'}
                                rightTextSpan={7}
                                toggled={uniqueValueCount.isNotFiltered}
                                index={index}
                                onToggle={() => {

                                    // Manually change the toggle status so it updates instantaneously
                                    const uniqueValueCountIndex = getUniqueValueCountIndexFromSortedIndex(index);
                                    setUniqueValueCounts(oldUniqueValueCounts => {
                                        const newUniqueValueCounts = oldUniqueValueCounts.slice();
                                        newUniqueValueCounts[uniqueValueCountIndex].isNotFiltered = !uniqueValueCounts[uniqueValueCountIndex].isNotFiltered
                                        return newUniqueValueCounts;
                                    })

                                    toggleExclusiveFilters([uniqueValueCount.value])
                                }}
                            />
                        )) 
                    })}
                </MultiToggleBox>
            </div>
            
        </Fragment>
    )
}
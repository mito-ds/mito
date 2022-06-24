// Copyright (c) Mito

import React, { Fragment, useRef, useState } from 'react';
import MitoAPI from '../../../../jupyter/api';
import MultiToggleBox from '../../../elements/MultiToggleBox';
import Select from '../../../elements/Select';
import { ColumnID, FormatTypeObj, UIState } from '../../../../types';
import Col from '../../../spacing/Col';
import Row from '../../../spacing/Row';
import { getFilterDisabledMessage } from './filter/utils';
import MultiToggleItem from '../../../elements/MultiToggleItem';
import DropdownItem from '../../../elements/DropdownItem';
import { useDebouncedEffect } from '../../../../hooks/useDebouncedEffect';
import { formatCellData } from '../../../../utils/formatColumns';
import OpenFillNaN from '../../FillNa/OpenFillNaN';
import Spacer from '../../../spacing/Spacer';
import RedoIcon from '../../../icons/RedoIcon';

/*
    The UniqueValueCount datatype contains all of the necessary data
    for each entry in the value section. It is responsible for holding
    information about itself that is used for determining how to display
    the unique value count in the MultiToggleBox
*/
export interface UniqueValueCount {
    value: string | number | boolean, // the value in the column
    percentOccurence: number, // the percent of rows in the column that are value
    countOccurence: number,
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

export function UniqueValuesCard(
    props: {
        selectedSheetIndex: number, 
        columnID: ColumnID,
        mitoAPI: MitoAPI;
        columnDtype: string,
        columnFormatType: FormatTypeObj
        setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    }): JSX.Element {

    const [loading, setLoading] = useState(true);

    const [isAllData, setIsAllData] = useState(false); // Start false, so we go get the data in the start
    const [uniqueValueCounts, setUniqueValueCounts] = useState<UniqueValueCount[]>([])

    const [searchString, setSearchString] = useState('');
    const [sort, setSort] = useState<UniqueValueSortType>(UniqueValueSortType.ASCENDING_ALPHABETICAL);

    // We store the toggled values in the frontend so that we can update their toggle
    // state immediately, for quick feedback to the user
    const [toggledValues, setToggledValues] = useState<[number | string | boolean, boolean][]>([])

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
        
        const _uniqueValueObj = await props.mitoAPI.getUniqueValueCounts(
            props.selectedSheetIndex,
            props.columnID,
            searchString,
            sort
        );

        if (_uniqueValueObj !== undefined) {
            const _uniqueValueObjs = _uniqueValueObj.uniqueValueCounts
            setUniqueValueCounts(_uniqueValueObjs);
            setIsAllData(_uniqueValueObj.isAllData);
            setToggledValues([]);
        } else {
            setUniqueValueCounts([])
        }
        setLoading(false);
    }

    const sortedUniqueValueCounts = sortUniqueValueCounts(uniqueValueCounts, sort);
    const disabledMessage = getFilterDisabledMessage(props.columnDtype);

    return (
        <Fragment>
            <Row justify='space-between' align='center'>
                <Col flex='1' offsetRight={1}>
                    <Row justify='start' align='center' suppressTopBottomMargin>
                        <Col>
                            <p className='text-header-3'> 
                                Unique Values
                            </p>
                        </Col>
                        <Col offset={1} title='Click to refresh unique values, in the case they are out of date.' onClick={loadUniqueValueCounts}>
                            <RedoIcon strokeWidth='2'/>
                        </Col>
                    </Row>
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
                    searchRightText={false}
                    searchState={{
                        searchString: searchString,
                        setSearchString: setSearchString
                    }}
                    isSubset={!isAllData}
                    message={disabledMessage}
                    disabled={disabledMessage !== undefined}
                    toggleAllIndexes={(_, newValue) => {
                        void props.mitoAPI.editBulkFilter(props.selectedSheetIndex, props.columnID, {
                            'type': 'toggle_all_matching',
                            'search_string': searchString,
                            'remove_from_dataframe': !newValue
                        })
                        setToggledValues(prevToggleValueIndexes => {
                            const newToggledValues = [...prevToggleValueIndexes]
                            sortedUniqueValueCounts.forEach(uniqueValueCount => {
                                const toggledValueIndex = newToggledValues.findIndex(([value, ]) => value === uniqueValueCount.value);
                                if (toggledValueIndex === -1) {
                                    newToggledValues.push([uniqueValueCount.value, newValue])
                                } else {
                                    newToggledValues[toggledValueIndex][1] = newValue;
                                    newToggledValues[toggledValueIndex][1] = newValue;
                                }
                            })
                            return newToggledValues;
                        })

                    }}
                >
                    {sortedUniqueValueCounts.map((uniqueValueCount, index) => {
                        const valueToDisplay = formatCellData(uniqueValueCount.value, props.columnDtype, props.columnFormatType);
                        const toggledValue = toggledValues.find(([value, ]) => value === uniqueValueCount.value);
                        const toggle = toggledValue !== undefined ? toggledValue[1] : uniqueValueCount.isNotFiltered

                        return((
                            <MultiToggleItem
                                key={index}
                                /**
                                 * If this is an NaN value, we display additional text that allows the user to navigate
                                 * to the fill NaN taskpane easily
                                 */
                                title={valueToDisplay !== 'NaN' ? valueToDisplay : <span>{valueToDisplay} <OpenFillNaN setUIState={props.setUIState} columnID={props.columnID}/></span>}
                                rightText={uniqueValueCount.countOccurence + ' (' + uniqueValueCount.percentOccurence.toFixed(2).toString() + '%' + ')'}
                                toggled={toggle}
                                index={index}
                                onToggle={() => {
                                    void props.mitoAPI.editBulkFilter(props.selectedSheetIndex, props.columnID, {type: 'toggle_specific_value', 'value': uniqueValueCount.value, 'remove_from_dataframe': toggle});
                                    setToggledValues(prevToggleValueIndexes => {
                                        const newToggledValues = [...prevToggleValueIndexes]
                                        const toggledValueIndex = newToggledValues.findIndex(([value, ]) => value === uniqueValueCount.value);
                                        if (toggledValueIndex === -1) {
                                            newToggledValues.push([uniqueValueCount.value, !toggle])
                                        } else {
                                            newToggledValues[toggledValueIndex][1] = !toggle;
                                            newToggledValues[toggledValueIndex][1] = !toggle;
                                        }
                                        return newToggledValues;
                                    })
                                }}
                            />
                        )) 
                    })}
                </MultiToggleBox>
                <Spacer px={10}/>
            </div>
            
        </Fragment>
    )
}
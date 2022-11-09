// Copyright (c) Mito

import React from 'react';
import '../../../../css/layout/CollapsibleSection.css';
import MitoAPI from '../../../jupyter/api';
import { ColumnID, FilterType, FrontendPivotParams, SheetData } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import DropdownButton from '../../elements/DropdownButton';
import DropdownItem from '../../elements/DropdownItem';
import SelectAndXIconCard from '../../elements/SelectAndXIconCard';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import { Filter } from '../ControlPanel/FilterAndSortTab/filter/Filter';
import PivotInvalidSelectedColumnsError from './PivotInvalidSelectedColumnsError';


const PivotTableFilterSection = (props: {
    mitoAPI: MitoAPI;
    sheetData: SheetData | undefined,
    params: FrontendPivotParams,
    setParams: React.Dispatch<React.SetStateAction<FrontendPivotParams>>
}): JSX.Element => {

    const columnIDsMap = props.sheetData?.columnIDsMap || {};
    const allColumnIDs = Object.keys(columnIDsMap);
    const columnIDsToDisplayHeaders: Record<ColumnID, string> = {};
    Object.entries(columnIDsMap).map(([columnID, columnHeader]) => {
        columnIDsToDisplayHeaders[columnID] = getDisplayColumnHeader(columnHeader)
    });

    return (
        <div>
            <Row justify='space-between' align='center'>
                <Col>
                    <p className='text-header-3'>
                        Filters
                    </p>
                </Col>
                <Col>
                    <DropdownButton
                        text='+ Add'
                        width='small'
                        searchable
                    >
                        {Object.entries(columnIDsMap).map(([columnID, columnHeader]) => {
                            return (
                                <DropdownItem
                                    key={columnID}
                                    title={getDisplayColumnHeader(columnHeader)}
                                    onClick={() => {
                                        props.setParams((prevParams) => {
                                            // We append to the start of the array so the filter is immediately visible to the user
                                            const newFiltersArray: {column_id: ColumnID, filter: FilterType}[] = [{
                                                'column_id': columnID,
                                                'filter': {
                                                    'condition': 'not_empty',
                                                    'value': ''
                                                }
                                            }];
                                            const newFilters = newFiltersArray.concat(prevParams.pivotFilters)

                                            return {
                                                ...prevParams,
                                                pivotFilters: newFilters
                                            }
                                        })
                                    }}
                                />
                            )
                        })}
                    </DropdownButton>
                </Col>
            </Row>
            <PivotInvalidSelectedColumnsError
                columnIDsMap={columnIDsMap}
                pivotSection={'values'}
                selectedColumnIDs={props.params.pivotFilters.map(({column_id}) => column_id)}
                mitoAPI={props.mitoAPI}
            />
            {
                props.params.pivotFilters.map(({column_id, filter}, index) => {
                    const columnDtype = props.sheetData?.columnDtypeMap[column_id] || '';

                    return (
                        <div className='mito-blue-container mb-5px' key={index}>
                            <Row>
                                <SelectAndXIconCard
                                    value={column_id}
                                    titleMap={columnIDsToDisplayHeaders}
                                    onChange={(newColumnId) => {
                                        props.setParams((prevParams) => {
                                            const newFilters = [...prevParams.pivotFilters];
                                            newFilters[index]['column_id'] = newColumnId;
                                            return {
                                                ...prevParams,
                                                pivotFilters: newFilters
                                            }
                                        })
                                    }}
                                    onDelete={() => {
                                        props.setParams((prevParams) => {
                                            const newFilters = [...prevParams.pivotFilters];
                                            newFilters.splice(index, 1);
                                            return {
                                                ...prevParams,
                                                pivotFilters: newFilters
                                            }
                                        })
                                    }}
                                    selectableValues={allColumnIDs}
                                />
                            </Row>
                            <Row suppressTopBottomMargin>
                                <Filter
                                    filter={filter}
                                    operator={'And'}
                                    displayOperator={false}
                                    setFilter={(newFilter) => {
                                        props.setParams((prevParams) => {
                                            const newFilters = [...prevParams.pivotFilters];
                                            newFilters[index]['filter'] = newFilter;
                                            return {
                                                ...prevParams,
                                                pivotFilters: newFilters
                                            }
                                        })
                                    }}
                                    columnDtype={columnDtype}
                                    nameLength={'long_name'}
                                />
                            </Row>
                        </div>
                    )
                })
            }
        </div>      
    )
} 

export default PivotTableFilterSection
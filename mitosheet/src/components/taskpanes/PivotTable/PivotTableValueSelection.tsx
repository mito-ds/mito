// Copyright (c) Mito

import React from 'react';
import { AggregationType, FrontendPivotParams, SheetData } from '../../../types';
import PivotTableValueAggregationCard from './PivotTableValueAggregationCard';
import PivotInvalidSelectedColumnsError from './PivotInvalidSelectedColumnsError';
import MitoAPI from '../../../jupyter/api';
import DropdownButton from '../../elements/DropdownButton';
import Row from '../../layout/Row';
import Col from '../../layout/Col';
import { ColumnID } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import { getPivotAggregationDisabledMessage } from './pivotUtils';

/* 
  A custom component used in the pivot table which lets the
  user select column headers to add to the row or column keys
*/
const PivotTableValueSelection = (props: {
    mitoAPI: MitoAPI,
    sheetData: SheetData | undefined,
    params: FrontendPivotParams,
    setParams: React.Dispatch<React.SetStateAction<FrontendPivotParams>>
}): JSX.Element => {

    const columnIDsMap = props.sheetData?.columnIDsMap || {};
    const columnDtypeMap = props.sheetData?.columnDtypeMap || {};

    return (
        <div>
            <Row justify='space-between' align='center'>
                <Col>
                    <p className='text-header-3'>
                        Values
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
                                        props.setParams(oldPivotParams => {
                                            const newPivotValuesIDs = [...oldPivotParams.pivotValuesColumnIDsArray];
                                            newPivotValuesIDs.push([columnID, AggregationType.COUNT]);
                                            return {
                                                ...oldPivotParams,
                                                pivotValuesColumnIDsArray: newPivotValuesIDs,
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
                selectedColumnIDs={props.params.pivotValuesColumnIDsArray.map(([columnID, ]) => columnID)}
                mitoAPI={props.mitoAPI}
            />
            {
                props.params.pivotValuesColumnIDsArray.map(([columnID, aggregationType], valueIndex) => {
                    const columnDtype = props.sheetData?.columnDtypeMap[columnID] || '';

                    return (
                        <PivotTableValueAggregationCard
                            key={columnID + valueIndex + aggregationType}
                            columnIDsMap={columnIDsMap}
                            columnID={columnID}
                            columnDtype={columnDtype}
                            aggregationType={aggregationType}
                            removePivotValueAggregation={() => {
                                props.setParams(oldPivotParams => {
                                    const newPivotValuesIDs = [...oldPivotParams.pivotValuesColumnIDsArray];
                                    newPivotValuesIDs.splice(valueIndex, 1);
                        
                                    return {
                                        ...oldPivotParams,
                                        pivotValuesColumnIDsArray: newPivotValuesIDs,
                                    }
                                })
                            }}
                            editPivotValueAggregation={(newAggregationType: AggregationType, newColumnID: ColumnID) => {
                                props.setParams(oldPivotParams => {
                                    const newPivotValuesIDs = [...oldPivotParams.pivotValuesColumnIDsArray];
                                    
                                    // We check if this is a valid aggregation for the column type. If not, we default it back to count
                                    const columnDtype = columnDtypeMap[newColumnID] || '';
                                    const isInvalidAggregation = getPivotAggregationDisabledMessage(aggregationType, columnDtype) !== undefined;
                                    if (isInvalidAggregation) {
                                        newAggregationType = AggregationType.COUNT
                                    }

                                    newPivotValuesIDs[valueIndex] = [newColumnID, newAggregationType];
                        
                                    return {
                                        ...oldPivotParams,
                                        pivotValuesColumnIDsArray: newPivotValuesIDs,
                                    }
                                })
                            }}
                        />
                    )
                })
            }
        </div>      
    )
} 

export default PivotTableValueSelection
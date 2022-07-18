// Copyright (c) Mito

import React from 'react';
import { AggregationType } from '../../../types';
import Select from '../../elements/Select';
import XIcon from '../../icons/XIcon';
import Row from '../../layout/Row';
import Col from '../../layout/Col';
import { ColumnID, ColumnIDsMap } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import { isDatetimeDtype, isStringDtype, isTimedeltaDtype } from '../../../utils/dtypes';

/**
 * Not every aggregation method works on all datatypes. 
 * We cover the most common cases when string, datetime, 
 * or timedelta columns are present.
 */
const STRING_AGGREGATIONS = [
    AggregationType.COUNT,
    AggregationType.COUNT_UNIQUE,
]
const DATETIME_AGGREGATIONS = [
    AggregationType.COUNT, 
    AggregationType.COUNT_UNIQUE,
    AggregationType.MEAN,
    AggregationType.MEDIAN,
    AggregationType.MIN,
    AggregationType.MAX
]
const TIMEDELTA_AGGREGATIONS = [
    AggregationType.COUNT, 
    AggregationType.COUNT_UNIQUE,
    AggregationType.SUM,
    AggregationType.MEAN,
    AggregationType.MEDIAN,
    AggregationType.MIN,
    AggregationType.MAX
]

/* 
  A custom component that displays the column headers chosen as the key for the pivot table. 
*/
const PivotTableValueAggregationCard = (props: {
    columnIDsMap: ColumnIDsMap,
    columnID: ColumnID,
    columnDtype: string,
    aggregationType: AggregationType
    removePivotValueAggregation: () => void;
    editPivotValueAggregation: (newAggregationType: AggregationType, newColumnID: string) => void;
}): JSX.Element => {

    // Create a list of the possible aggregation methods
    const aggregationTypeList = Object.values(AggregationType);
    
    const setAggregationType = (aggregationType: string): void => {
        // Declare the aggregationType param of type AggregationType and then make sure that it is
        const aggregationTypeCast = aggregationType as AggregationType
        if (aggregationTypeList.includes(aggregationTypeCast)) {
            props.editPivotValueAggregation(aggregationTypeCast, props.columnID);
        }
    }

    return (
        <Row align='center'>
            <Col>
                <Select
                    value={props.aggregationType}
                    onChange={setAggregationType}
                    width='small'
                    dropdownWidth='medium'
                >
                    {aggregationTypeList.map(aggregationType => {

                        let disabled = false
                        let columnDtypeLabel = ''
                        if (isStringDtype(props.columnDtype) && !STRING_AGGREGATIONS.includes(aggregationType)) {
                            disabled = true
                            columnDtypeLabel = 'string'
                        } else if (isDatetimeDtype(props.columnDtype) && !DATETIME_AGGREGATIONS.includes(aggregationType)) {
                            disabled = true
                            columnDtypeLabel = 'datetime'
                        } else if (isTimedeltaDtype(props.columnDtype) && !TIMEDELTA_AGGREGATIONS.includes(aggregationType)) {
                            disabled = true
                            columnDtypeLabel = 'timedelta'
                        }

                        return (
                            <DropdownItem
                                key={aggregationType}
                                title={aggregationType}
                                disabled={disabled}
                                subtext={disabled ? `Not valid for ${columnDtypeLabel} column`: undefined}
                                hideSubtext={true}
                                displaySubtextOnHover={true}
                            />
                        )
                    })}
                </Select>
            </Col>
            <Col offset={1} flex='1'>
                <Select 
                    value={props.columnID}
                    onChange={(columnID: ColumnID) => {
                        props.editPivotValueAggregation(
                            props.aggregationType, 
                            columnID
                        )
                    }}
                    searchable
                >
                    {Object.keys(props.columnIDsMap).map(columnID => {
                        const columnHeader = props.columnIDsMap[columnID];
                        return (
                            <DropdownItem
                                key={columnID}
                                id={columnID}
                                title={getDisplayColumnHeader(columnHeader)}
                            />
                        )
                    })}
                </Select>
            </Col>
            <Col offset={1} offsetRight={1}>
                <XIcon
                    onClick={() => props.removePivotValueAggregation()}
                />
            </Col>
        </Row>
    )
} 

export default PivotTableValueAggregationCard
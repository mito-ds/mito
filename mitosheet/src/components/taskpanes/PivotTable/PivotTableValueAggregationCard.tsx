// Copyright (c) Mito

import React from 'react';
import { AggregationType } from './PivotTaskpane';
import Select from '../../elements/Select';
import XIcon from '../../icons/XIcon';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';
import { ColumnIDsMap } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';

/* 
  A custom component that displays the column headers chosen as the key for the pivot table. 
*/
const PivotTableValueAggregationCard = (props: {
    columnIDsMap: ColumnIDsMap,
    columnID: string,
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
                    dropdownWidth='small'
                >
                    {aggregationTypeList.map(aggregationType => {
                        return (
                            <DropdownItem
                                key={aggregationType}
                                title={aggregationType}
                            />
                        )
                    })}
                </Select>
            </Col>
            <Col offset={1} flex='1'>
                <Select 
                    value={props.columnID}
                    onChange={(columnID: string ) => {
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
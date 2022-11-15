// Copyright (c) Mito

import React from 'react';
import MitoAPI from '../../../jupyter/api';
import { AggregationType, ColumnID, ColumnIDsMap, SheetData } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import DropdownButton from '../../elements/DropdownButton';
import DropdownItem from '../../elements/DropdownItem';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import PivotInvalidSelectedColumnsError from './PivotInvalidSelectedColumnsError';
import PivotTableValueAggregationCard from './PivotTableValueAggregationCard';
import LabelAndTooltip from '../../elements/LabelAndTooltip';

const VALUES_TOOLTIP = 'Values are used to summarize your source data for each of the pivot table buckets. These buckets are created by the rows and/or columns selected above.'

/* 
  A custom component used in the pivot table which lets the
  user select column headers to add to the row or column keys
*/
const PivotTableValueSelection = (props: {
    sheetData: SheetData | undefined,
    columnIDsMap: ColumnIDsMap,
    pivotValuesColumnIDsArray: [ColumnID, AggregationType][];
    addPivotValueAggregation: (columnID: ColumnID) => void;
    removePivotValueAggregation: (valueIndex: number) => void;
    editPivotValueAggregation: (valueIndex: number, newAggregationType: AggregationType, newColumnID: string) => void;
    mitoAPI: MitoAPI;
}): JSX.Element => {

    return (
        <div>
            <Row justify='space-between' align='center'>
                <Col>
                    <LabelAndTooltip tooltip={VALUES_TOOLTIP}>
                        Values
                    </LabelAndTooltip>
                </Col>
                <Col>
                    <DropdownButton
                        text='+ Add'
                        width='small'
                        searchable
                    >
                        {Object.entries(props.columnIDsMap).map(([columnID, columnHeader]) => {
                            return (
                                <DropdownItem
                                    key={columnID}
                                    title={getDisplayColumnHeader(columnHeader)}
                                    onClick={() => {
                                        props.addPivotValueAggregation(columnID)
                                    }}
                                />
                            )
                        })}
                    </DropdownButton>
                </Col>
            </Row>
            <PivotInvalidSelectedColumnsError
                columnIDsMap={props.columnIDsMap}
                pivotSection={'values'}
                selectedColumnIDs={props.pivotValuesColumnIDsArray.map(([columnID, ]) => columnID)}
                mitoAPI={props.mitoAPI}
            />
            {
                props.pivotValuesColumnIDsArray.map(([columnID, aggregationType], valueIndex) => {
                    const columnDtype = props.sheetData?.columnDtypeMap[columnID] || '';

                    return (
                        <PivotTableValueAggregationCard
                            key={columnID + valueIndex + aggregationType}
                            columnIDsMap={props.columnIDsMap}
                            columnID={columnID}
                            columnDtype={columnDtype}
                            aggregationType={aggregationType}
                            removePivotValueAggregation={() => {
                                props.removePivotValueAggregation(valueIndex);
                            }}
                            editPivotValueAggregation={(newAggregationType: AggregationType, newColumnID: ColumnID) => {
                                props.editPivotValueAggregation(valueIndex, newAggregationType, newColumnID);
                            }}
                        />
                    )
                })
            }
        </div>      
    )
} 

export default PivotTableValueSelection
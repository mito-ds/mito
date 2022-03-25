// Copyright (c) Mito

import React from 'react';
import { AggregationType, SheetData } from '../../../types';
import PivotTableValueAggregationCard from './PivotTableValueAggregationCard';
import PivotInvalidSelectedColumnsError from './PivotInvalidSelectedColumnsError';
import MitoAPI from '../../../api';
import DropdownButton from '../../elements/DropdownButton';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';
import { ColumnID, ColumnIDsMap } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';

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
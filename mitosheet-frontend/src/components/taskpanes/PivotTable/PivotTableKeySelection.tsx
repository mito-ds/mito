// Copyright (c) Mito

import React from 'react';
import '../../../../css/layout/CollapsibleSection.css';
import { MitoAPI } from '../../../api/api';
import { ColumnID, ColumnIDWithPivotTransform, FrontendPivotParams, PivotColumnTransformation, SheetData } from '../../../types';
import { columnIDMapToDisplayHeadersMap, getDisplayColumnHeader } from '../../../utils/columnHeaders';
import { isDatetimeDtype } from '../../../utils/dtypes';
import DropdownButton from '../../elements/DropdownButton';
import DropdownItem from '../../elements/DropdownItem';
import LabelAndTooltip from '../../elements/LabelAndTooltip';
import Select from '../../elements/Select';
import SelectAndXIconCard from '../../elements/SelectAndXIconCard';
import Col from '../../layout/Col';
import Row from '../../layout/Row';
import PivotInvalidSelectedColumnsError from './PivotInvalidSelectedColumnsError';

const PIVOT_COLUMN_TRANSFORM_TITLES: Record<PivotColumnTransformation, string> = {
    'no-op': 'exact time',
    'year': 'year',
    'year-quarter': 'year-quarter',
    'year-month': 'year-month',
    'year-month-day': 'year-month-day',
    'year-month-day-hour': 'year-month-day-hour',
    'year-month-day-hour-minute': 'year-month-day-hour-minute',
    'quarter': 'quarter',
    'month': 'month',
    'week': 'week',
    'day of month': 'day of month',
    'day of week': 'day of week',
    'hour': 'hour',
    'minute': 'minute',
    'second': 'second',
    'month-day': 'month-day',
    'day-hour': 'day-hour',
    'hour-minute': 'hour-minute'
} 

const GROUP_DATE_BY_TOOLTIP = 'Date columns can be further processed before being aggregated. For example, if you want to compare the aggregated values across months, then select `months` in this dropdown.';
const ROWS_TOOLTIP = "Rows are used to group your source data into distinct buckets. The unique values that create the buckets are placed in the first column of the resulting pivot table."
const COLUMNS_TOOLTIP = 'Columns are used to group your source data into distinct buckets. The unique values that create the buckets are placed across the top of the resulting pivot table. For the best performance, select columns with a small number of unique values.'
/* 
  A custom component used in the pivot table which lets the
  user select column headers to add to the row or column keys
*/
const PivotTableKeySelection = (props: {
    mitoAPI: MitoAPI;
    sheetData: SheetData | undefined;
    sectionTitle: string;
    params: FrontendPivotParams;
    setParams: React.Dispatch<React.SetStateAction<FrontendPivotParams>>;
    rowOrColumn: 'pivotRowColumnIDsWithTransforms' | 'pivotColumnsColumnIDsWithTransforms';
}): JSX.Element => {
    
    const columnIDsMap = props.sheetData?.columnIDsMap || {};
    const columnDtypeMap = props.sheetData?.columnDtypeMap || {};
    const columnIdsWithTransforms: ColumnIDWithPivotTransform[] = props.rowOrColumn === 'pivotRowColumnIDsWithTransforms' ? [...props.params.pivotRowColumnIDsWithTransforms] : [...props.params.pivotColumnsColumnIDsWithTransforms];

    const pivotTableKeyCards: JSX.Element[] = columnIdsWithTransforms.map(({column_id, transformation}, keyIndex) => {
        const columnID: ColumnID | undefined = columnDtypeMap[column_id];

        const selectAndXIcon = (
            <SelectAndXIconCard 
                key={keyIndex}
                value={column_id}
                titleMap={columnIDMapToDisplayHeadersMap(columnIDsMap)}
                onChange={(columnID) => {
                    props.setParams(oldPivotParams => {
                        const newColumnIDsWithTransforms = [...columnIdsWithTransforms];
                        
                        newColumnIDsWithTransforms[keyIndex].column_id = columnID;
                
                        return {
                            ...oldPivotParams,
                            [props.rowOrColumn]: newColumnIDsWithTransforms,
                        }
                    })
                }}
                onDelete={() => {
                    props.setParams(oldPivotParams => {
                        const newColumnIDsWithTransforms = [...columnIdsWithTransforms];
                        
                        newColumnIDsWithTransforms.splice(keyIndex, 1);
                
                        return {
                            ...oldPivotParams,
                            [props.rowOrColumn]: newColumnIDsWithTransforms,
                        }
                    })
                }}
                selectableValues={Object.keys(columnIDsMap)}
            />
        )

        if (columnID !== undefined && isDatetimeDtype(columnID)) {
            return (
                <div className='mito-blue-container mt-4px mb-4px' key={keyIndex}>
                    {selectAndXIcon}
                    <Row justify='start' align='center'>
                        <Col offset={.25}>
                            <LabelAndTooltip tooltip={GROUP_DATE_BY_TOOLTIP} textBody>
                                group by
                            </LabelAndTooltip>
                        </Col>
                        <Col>
                            <Select
                                value={transformation}
                                onChange={(newTransformation: string) => {
                                    props.setParams(oldPivotParams => {
                                        const newColumnIDsWithTransforms = [...columnIdsWithTransforms];
                                        
                                        newColumnIDsWithTransforms[keyIndex].transformation = newTransformation as PivotColumnTransformation;
                                
                                        return {
                                            ...oldPivotParams,
                                            [props.rowOrColumn]: newColumnIDsWithTransforms,
                                        }
                                    })
                                }}
                                searchable
                                width='medium'
                            >
                                {Object.entries(PIVOT_COLUMN_TRANSFORM_TITLES).map(([key, value]) => {
                                    return (
                                        <DropdownItem
                                            key={key}
                                            id={key}
                                            title={value}
                                        />
                                    )
                                })}
                            </Select>
                        </Col>
                    </Row>
                </div>
            )
        }


        return selectAndXIcon;
    })

    return (
        <div>
            <Row justify='space-between' align='center'>
                <Col>
                    <LabelAndTooltip tooltip={props.rowOrColumn === 'pivotRowColumnIDsWithTransforms' ? ROWS_TOOLTIP : COLUMNS_TOOLTIP}>
                        {props.sectionTitle}
                    </LabelAndTooltip>
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
                                            const newColumnIDsWithTransforms = [...columnIdsWithTransforms];
                                            
                                            newColumnIDsWithTransforms.push({
                                                'column_id': columnID,
                                                'transformation': 'no-op'
                                            })
                                    
                                            return {
                                                ...oldPivotParams,
                                                [props.rowOrColumn]: newColumnIDsWithTransforms,
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
                selectedColumnIDs={columnIdsWithTransforms.map(({column_id}) => column_id)}
                pivotSection={props.rowOrColumn === 'pivotRowColumnIDsWithTransforms' ? 'row' : 'column'}
                mitoAPI={props.mitoAPI}
            />
            {pivotTableKeyCards}
        </div>      
    )
} 

export default PivotTableKeySelection
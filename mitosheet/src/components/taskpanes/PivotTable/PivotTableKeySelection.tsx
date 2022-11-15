// Copyright (c) Mito

import React from 'react';
import '../../../../css/layout/CollapsibleSection.css';
import PivotInvalidSelectedColumnsError from './PivotInvalidSelectedColumnsError';
import MitoAPI from '../../../jupyter/api';
import DropdownButton from '../../elements/DropdownButton';
import Row from '../../layout/Row';
import Col from '../../layout/Col';
import { ColumnIDWithPivotTransform, FrontendPivotParams, SheetData, PivotColumnTransformation } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import { columnIDMapToDisplayHeadersMap, getDisplayColumnHeader } from '../../../utils/columnHeaders';
import SelectAndXIconCard from '../../elements/SelectAndXIconCard';
import { isDatetimeDtype } from '../../../utils/dtypes';
import Tooltip from '../../elements/Tooltip';
import Select from '../../elements/Select';

const PIVOT_COLUMN_TRANSFORM_TITLES: Record<PivotColumnTransformation, string> = {
    'no-op': 'exact time',
    'year': 'year',
    'quarter': 'quarter',
    'month': 'month',
    'week': 'week',
    'day of month': 'day of month',
    'day of week': 'day of week',
    'hour': 'hour',
    'minute': 'minute',
    'second': 'second',
    'year-month-day-hour-minute': 'year-month-day-hour-minute',
    'year-month-day-hour': 'year-month-day-hour',
    'year-month-day': 'year-month-day',
    'year-month': 'year-month',
    'year-quarter': 'year-quarter',
    'month-day': 'month-day',
    'day-hour': 'day-hour',
    'hour-minute': 'hour-minute'
} 

/* 
  A custom component used in the pivot table which lets the
  user select column headers to add to the row or column keys
*/
const PivotTableKeySelection = (props: {
    mitoAPI: MitoAPI;
    sheetData: SheetData | undefined;
    sectionTitle: string;
    sectionSubtext?: string;
    params: FrontendPivotParams;
    setParams: React.Dispatch<React.SetStateAction<FrontendPivotParams>>;
    rowOrColumn: 'pivotRowColumnIDsWithTransforms' | 'pivotColumnsColumnIDsWithTransforms';
}): JSX.Element => {
    
    const columnIDsMap = props.sheetData?.columnIDsMap || {};
    const columnDtypeMap = props.sheetData?.columnDtypeMap || {};
    const columnIdsWithTransforms: ColumnIDWithPivotTransform[] = props.rowOrColumn === 'pivotRowColumnIDsWithTransforms' ? [...props.params.pivotRowColumnIDsWithTransforms] : [...props.params.pivotColumnsColumnIDsWithTransforms];

    const pivotTableKeyCards: JSX.Element[] = columnIdsWithTransforms.map(({column_id, transformation}, keyIndex) => {
        const columnID = columnDtypeMap[column_id];

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

        if (isDatetimeDtype(columnID)) {
            return (
                <div className='mito-blue-container mt-4px mb-4px'>
                    {selectAndXIcon}
                    <Row justify='space-between' align='center'>
                        <Col offset={.25}>
                            <Row suppressTopBottomMargin align='center'>
                                <Col>
                                    group date by
                                </Col>
                                <Col>
                                    <Tooltip title='Date columns can be further processed before being aggregated. For example, if you want to compare the aggregated values across months, then select `months` in this dropdown.'/>
                                </Col>
                            </Row>
                        </Col>
                        <Col offsetRight={3}>
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
                    <p className='text-header-3'>
                        {props.sectionTitle}
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
            {props.sectionSubtext !== undefined &&
                <p className='text-subtext-1'>
                    {props.sectionSubtext}
                </p>
            }
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
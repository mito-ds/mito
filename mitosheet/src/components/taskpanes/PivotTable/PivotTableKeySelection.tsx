// Copyright (c) Mito

import React from 'react';
import PivotInvalidSelectedColumnsError from './PivotInvalidSelectedColumnsError';
import MitoAPI from '../../../jupyter/api';
import DropdownButton from '../../elements/DropdownButton';
import Row from '../../layout/Row';
import Col from '../../layout/Col';
import { ColumnID, ColumnIDsMap } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import { columnIDMapToDisplayHeadersMap, getDisplayColumnHeader } from '../../../utils/columnHeaders';
import SelectAndXIconCard from '../../elements/SelectAndXIconCard';
import Tooltip from '../../elements/Tooltip';

const ROWS_TOOLTIP = 'If rows are selected, then unique values from this column in the source dataset are placed in the first column of the resulting pivot table. All row values are unique and duplicates are removed.'
const COLUMNS_TOOLTIP = 'If columns are selected, then the unique values from each column are placed across the top of the resulting pivot table. For the best performance, select columns with a small number of unique values.'

/* 
  A custom component used in the pivot table which lets the
  user select column headers to add to the row or column keys
*/
const PivotTableKeySelection = (props: {
    sectionTitle: string;
    rowOrColumn: 'row' | 'column';
    columnIDsMap: ColumnIDsMap;
    selectedColumnIDs: ColumnID[];
    addKey: (columnID: ColumnID) => void;
    removeKey: (keyIndex: number) => void;
    editKey: (keyIndex: number, newColumnID: ColumnID) => void;
    mitoAPI: MitoAPI;
}): JSX.Element => {

    const pivotTableColumnIDsCards: JSX.Element[] = props.selectedColumnIDs.map((columnID, keyIndex) => {
        return (
            <SelectAndXIconCard 
                key={keyIndex}
                value={columnID}
                titleMap={columnIDMapToDisplayHeadersMap(props.columnIDsMap)}
                onChange={(columnID) => props.editKey(keyIndex, columnID)}
                onDelete={() => props.removeKey(keyIndex)}
                selectableValues={Object.keys(props.columnIDsMap)}
            />
        )
    })

    return (
        <div>
            <Row justify='space-between' align='center'>
                <Col>
                    <Row align='center' suppressTopBottomMargin>
                        <Col>
                            <p className='text-header-3'>
                                {props.sectionTitle}
                            </p>
                        </Col>
                        <Col>
                            <Tooltip title={props.rowOrColumn === 'row' ? ROWS_TOOLTIP : COLUMNS_TOOLTIP}/>
                        </Col>
                    </Row>
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
                                        props.addKey(columnID)
                                    }}
                                />
                            )
                        })}
                    </DropdownButton>
                </Col>
            </Row>
            <PivotInvalidSelectedColumnsError
                columnIDsMap={props.columnIDsMap}
                selectedColumnIDs={props.selectedColumnIDs}
                pivotSection={props.rowOrColumn}
                mitoAPI={props.mitoAPI}
            />
            {pivotTableColumnIDsCards}
        </div>      
    )
} 

export default PivotTableKeySelection
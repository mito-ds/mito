// Copyright (c) Mito

import React from 'react';
import PivotTableColumnHeaderCard from './PivotTableColumnHeaderCard';
import PivotInvalidSelectedColumnsError from './PivotInvalidSelectedColumnsError';
import MitoAPI from '../../../api';
import DropdownButton from '../../elements/DropdownButton';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';
import { ColumnIDsMap } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';

/* 
  A custom component used in the pivot table which lets the
  user select column headers to add to the row or column keys
*/
const PivotTableKeySelection = (props: {
    sectionTitle: string;
    rowOrColumn: 'row' | 'column';
    columnIDsMap: ColumnIDsMap;
    selectedColumnIDs: string[];
    addKey: (columnID: string) => void;
    removeKey: (keyIndex: number) => void;
    editKey: (keyIndex: number, newColumnID: string) => void;
    mitoAPI: MitoAPI;
}): JSX.Element => {

    const pivotTableColumnIDsCards: JSX.Element[] = props.selectedColumnIDs.map((columnID, keyIndex) => {
        return (
            <PivotTableColumnHeaderCard 
                key={columnID + keyIndex}
                columnIDsMap={props.columnIDsMap}
                columnID={columnID}
                keyIndex={keyIndex}
                removeKey={props.removeKey}
                editKey={props.editKey}
            />
        )
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
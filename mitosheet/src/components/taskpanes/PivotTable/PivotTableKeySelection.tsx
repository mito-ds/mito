// Copyright (c) Mito

import React, { useState } from 'react';
import PivotInvalidSelectedColumnsError from './PivotInvalidSelectedColumnsError';
import MitoAPI from '../../../jupyter/api';
import DropdownButton from '../../elements/DropdownButton';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';
import { ColumnID, ColumnIDsMap } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import { columnIDMapToDisplayHeadersMap, getDisplayColumnHeader } from '../../../utils/columnHeaders';
import SelectAndXIconCard from '../../elements/SelectAndXIconCard';

/* 
  A custom component used in the pivot table which lets the
  user select column headers to add to the row or column keys
*/
const PivotTableKeySelection = (props: {
    sectionTitle: string;
    sectionSubtext?: string;
    rowOrColumn: 'row' | 'column';
    columnIDsMap: ColumnIDsMap;
    selectedColumnIDs: ColumnID[];
    addKey: (columnID: ColumnID) => void;
    removeKey: (keyIndex: number) => void;
    reorderKey: (keyIndex: number, newKeyIndex: number) => void;
    editKey: (keyIndex: number, newColumnID: ColumnID) => void;
    mitoAPI: MitoAPI;
}): JSX.Element => {


    const [beingDragged, setBeingDragged] = useState<string | undefined>(undefined);

    const onDragStart = (ev: React.MouseEvent) => {
        const id = ev.currentTarget.id;
        console.log("on drag start", id)
        setBeingDragged(id);
    }

    const onDrop = (ev: React.MouseEvent) => {
        const droppedOnId = ev.currentTarget.id;

        // We are moving beingDragged to droppedOnID
        console.log("moving", beingDragged, "to", droppedOnId)

        if (beingDragged) {
            const keyIndex = props.selectedColumnIDs.indexOf(beingDragged)
            const newKeyIndex = props.selectedColumnIDs.indexOf(droppedOnId)

            if (keyIndex !== -1 && newKeyIndex !== -1) {
                props.reorderKey(keyIndex, newKeyIndex);
            }
        }
    }

    const pivotTableColumnIDsCards: JSX.Element[] = props.selectedColumnIDs.map((columnID, keyIndex) => {
        return (
            <SelectAndXIconCard 
                key={keyIndex}
                value={columnID}
                titleMap={columnIDMapToDisplayHeadersMap(props.columnIDsMap)}
                onChange={(columnID) => props.editKey(keyIndex, columnID)}
                onDelete={() => props.removeKey(keyIndex)}
                selectableValues={Object.keys(props.columnIDsMap)}
                draggable
                onDrop={onDrop}
                onDragStart={onDragStart}
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
            {props.sectionSubtext !== undefined &&
                <p className='text-subtext-1'>
                    {props.sectionSubtext}
                </p>
            }
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
// Copyright (c) Saga Inc.

import React from 'react';
import XIcon from '../icons/XIcon';
import Select from './Select';
import Row from '../spacing/Row';
import Col from '../spacing/Col';
import { ColumnID, ColumnIDsMap } from '../../types';
import DropdownItem from './DropdownItem';
import { getDisplayColumnHeader } from '../../utils/columnHeaders';


/*
    This component is a row with a select followed by an X Icon.
*/
const SelectAndXIconCard = (props: {
    columnID: ColumnID
    columnIDsMap: ColumnIDsMap;
    onChange: (columnID: string) => void;
    onDelete: () => void;
    selectableColumnIDs: ColumnID[]
}): JSX.Element => {

    return (
        <Row key={props.columnID} justify='space-between' align='center'>
            <Col flex='1'>
                <Select
                    value={props.columnID}
                    onChange={(columnID: string) => props.onChange(columnID)}
                    searchable
                >
                    {props.selectableColumnIDs.map(columnID => {
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
                    onClick={() => {props.onDelete()}}
                />
            </Col>
        </Row>
    )
};

export default SelectAndXIconCard;
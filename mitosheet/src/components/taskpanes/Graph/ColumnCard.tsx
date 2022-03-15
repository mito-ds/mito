// Copyright (c) Saga Inc.

import React from 'react';
import XIcon from '../../icons/XIcon';
import Select from '../../elements/Select';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';

import '../../../../css/taskpanes/Graph/AxisSection.css'
import { ColumnID, ColumnIDsMap } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';

const ColumnCard = (props: {
    columnID: ColumnID
    columnIDsMap: ColumnIDsMap;
    onChange: (columnID: string) => void;
    onXIconClick: () => void;
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
                    onClick={() => {props.onXIconClick()}}
                />
            </Col>
        </Row>
    )
};

export default ColumnCard;
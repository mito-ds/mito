// Copyright (c) Mito

import React from 'react';
import { ColumnIDsMap } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import DropdownItem from '../../elements/DropdownItem';
import Select from '../../elements/Select';
import XIcon from '../../icons/XIcon';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';

/* 
  A custom component that displays the column headers chosen as the key for the pivot table. 
*/
const PivotTableColumnHeaderCard = (props: {
    columnIDsMap: ColumnIDsMap;
    columnID: string,
    keyIndex: number;
    removeKey: (keyIndex: number) => void;
    editKey: (keyIndex: number, newColumnID: string) => void;
}): JSX.Element => {

    return (
        <Row 
            justify='space-between'
            align='center'
        >
            <Col flex='1'>
                <Select
                    value={props.columnID}
                    onChange={(columnID: string) => {
                        props.editKey(
                            props.keyIndex, 
                            columnID
                        )
                    }}
                    searchable
                >
                    {Object.entries(props.columnIDsMap).map(([columnID, columnHeader]) => {
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
                    onClick={() => props.removeKey(props.keyIndex)}                
                />
            </Col>
        </Row>
          
    )
} 

export default PivotTableColumnHeaderCard
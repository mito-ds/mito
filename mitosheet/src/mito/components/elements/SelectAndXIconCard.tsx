/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Saga Inc.

import React from 'react';
import XIcon from '../icons/XIcon';
import Select from './Select';
import Row from '../layout/Row';
import Col from '../layout/Col';
import DropdownItem from './DropdownItem';


interface SelectAndXIconProps {
    value: string,
    titleMap?: Record<string, string>; // Map from id -> display title
    onChange: (newID: string) => void;
    onDelete: () => void;
    selectableValues: string[]
}


/*
    This component is a row with a select followed by an X Icon.
*/
const SelectAndXIconCard = (props: SelectAndXIconProps): JSX.Element => {

    return (
        <Row key={props.value} justify='space-between' align='center'>
            <Col flex='1'>
                <Select
                    value={props.value + ''}
                    onChange={(newID: string) => {
                        props.onChange(newID)
                    }}
                    searchable
                >
                    {props.selectableValues.map(id => {
                        const title = props.titleMap ? props.titleMap[id] : id;
                        return (
                            <DropdownItem
                                key={id}
                                id={id}
                                title={title}
                            />
                        )
                    })}
                </Select>
            </Col>
            <Col offset={1} offsetRight={1}>
                <XIcon
                    onClick={props.onDelete}
                />
            </Col>
        </Row>
    )
};

export default SelectAndXIconCard;
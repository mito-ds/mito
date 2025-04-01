/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito
import React from 'react';
import QuestionMarkIcon from '../icons/QuestionMarkIcon';
import Row from '../layout/Row';

interface TooltipProps {
    /** 
        * @param title - The test to display when the tooltip is hovered on.
    */
    title: string;
}

/**
 * The Tooltip component, which is useful if you're looking to make it clear
 * to the user that they can hover over something to get the title for it.
 */
const Tooltip = (props: TooltipProps): JSX.Element => {

    return (
        <Row 
            justify='center'
            align='center'
            title={props.title}
        >
            <QuestionMarkIcon/>
        </Row>
    )
}

export default Tooltip;
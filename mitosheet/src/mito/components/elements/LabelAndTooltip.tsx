// Copyright (c) Mito
import React from 'react';

import Col from '../layout/Col';
import Row from '../layout/Row';
import Tooltip from './Tooltip';

/**
 * A Label for a section in a taskpane, with a Tooltip attached to it
 */ 

const LabelAndTooltip = (props: {
    /** 
        * @param children - The main text to display as a section label
    */
    children: string;
    
    /** 
        * @param tooltip - The tooltip to display in the ? icon
    */
    tooltip: string

    /** 
        * @param textBody - If this should be a text body rather than a header
    */
    textBody?: boolean

    style?: React.CSSProperties;

}): JSX.Element => {

    return (
        <Row justify='start' align='center' title={props.tooltip} suppressTopBottomMargin>
            <Col>
                <p style={props.style} className={props.textBody ? 'text-body-1' : 'text-header-3'}>
                    {props.children}
                </p>
            </Col>
            <Col>
                <Tooltip title={props.tooltip}/>
            </Col>
        </Row>
    )
} 

export default LabelAndTooltip;
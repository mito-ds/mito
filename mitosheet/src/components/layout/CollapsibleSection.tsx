// Copyright (c) Mito
import React, { useState } from 'react';

import '../../../css/layout/CollapsibleSection.css'
import DownArrowIcon from '../icons/DownArrowIcon';
import UpArrowIcon from '../icons/UpArrowIcon';
import Col from './Col';
import Row from './Row';

interface CollapsibleSectionProps {
    /** 
       * @param [title] - Title to put on the column div
    */
    title: string;
    /** 
        * @param [children] - The content that is going inside of this column, to actually be displayed. All overflow will be cut off.
    */
    children?: React.ReactNode,
}


/**
 * A section that has a title and can be collapsed or expanded
 */ 
const CollapsibleSection = (props: CollapsibleSectionProps): JSX.Element => {

    const [open, setOpen] = useState(false); // todo allow you to pass this through
    
    if (open) {
        return (
            <div
                className='mito-collapsible-section' 
            >
                <Row justify='space-between' align='center' onClick={() => {setOpen(false)}}>
                    <Col>
                        <div className='text-header-3'>
                            {props.title}
                        </div>
                    </Col>
                    <Col>
                        <UpArrowIcon/>
                    </Col>
                </Row>
                {props.children}
            </div>
        )
    } else {
        return (
            <div 
                className='mito-collapsible-section'
                onClick={() => {setOpen(true)}}
            >
                <Row justify='space-between' align='center'>
                    <Col>
                        <div className='text-header-3'>
                            {props.title}
                        </div>
                    </Col>
                    <Col>
                        <DownArrowIcon/>
                    </Col>
                </Row>
            </div>
        )
    }
} 

export default CollapsibleSection;
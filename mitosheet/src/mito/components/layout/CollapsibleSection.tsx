/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';

import '../../../../css/layout/CollapsibleSection.css'
import DownArrowIcon from '../icons/DownArrowIcon';
import UpArrowIcon from '../icons/UpArrowIcon';
import Col from './Col';
import Row from './Row';
import ProIcon from '../icons/ProIcon'
import { classNames } from '../../utils/classNames';


interface CollapsibleSectionProps {
    /** 
       * @param [title] - Title to put on the column div
    */
    title: string | JSX.Element;
    /** 
        * @param [children] - The content that is going inside of this column, to actually be displayed. All overflow will be cut off.
    */
    children?: React.ReactNode,

    /**
        * @param [pro] - Whether the Pro icon should be displayed if the user is not on pro
    */
    proSection?: boolean

    /**
        * @param [isPro] - If the user is on pro or not
    */
    isPro?: boolean

    /**
        * @param [open] - You can optionally override the open state from the outside by passing this variable
    */
    open?: boolean

    /**
        * @param [disabled] - Force closed, and don't let it open
    */
    disabled?: boolean
}


/**
 * A section that has a title and can be collapsed or expanded
 */ 
const CollapsibleSection = (props: CollapsibleSectionProps): JSX.Element => {

    const [open, setOpen] = useState(props.open || false); 
    
    useEffect(() => {
        if (props.open !== undefined) {
            setOpen(props.open);
        }
    }, [props.open])

    if (open && props.disabled !== true) {
        return (
            <div
                className='mito-blue-container' 
            >
                <Row justify='space-between' align='center' onClick={() => {setOpen(false)}}>
                    <Col>
                        <Row suppressTopBottomMargin>
                            {typeof props.title === 'string' && 
                                <div className='text-header-3'>
                                    {props.title}
                                </div>
                            } 
                            {typeof props.title !== 'string' &&
                                props.title
                            }   
                            &nbsp; {props.proSection && !props.isPro && <ProIcon />}
                        </Row>
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
                className={classNames('mito-blue-container', {'mito-blue-container-disabled': props.disabled})}
                onClick={() => {setOpen(true)}}
            >
                <Row justify='space-between' align='center'>
                    <Col>
                        <Row suppressTopBottomMargin>
                            {typeof props.title === 'string' && 
                                <div className='text-header-3'>
                                    {props.title}
                                </div>
                            } 
                            {typeof props.title !== 'string' &&
                                props.title
                            }   
                            &nbsp; {props.proSection && !props.isPro && <ProIcon />}
                        </Row>
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
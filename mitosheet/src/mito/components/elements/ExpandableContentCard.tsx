/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '../../../../css/elements/ExpandableContentCard.css'
import Row from '../layout/Row';
import Col from '../layout/Col';
import XIcon from '../icons/XIcon';
import UpArrowIcon from '../icons/UpArrowIcon';
import DownArrowIcon from '../icons/DownArrowIcon';



interface ExpandableContentCardProps {
    title: React.ReactNode,
    subtitle: React.ReactNode,
    icon?: React.ReactNode,
    iconTitle?: string

    expandedTitle: string,
    children: React.ReactNode,
    
    isExpanded: boolean;
    setExpanded: (isExpanded: boolean) => void;
    
    onDelete: () => void;
    
}


/**
 * This element is useful when you want a list of collapsible cards that contain user editable
 * content - check out the conditional formatting and excel range import for examples.
 */
const ExpandableContentCard = (props: ExpandableContentCardProps): JSX.Element => {

    const XElement = (
        <Col title='Delete conditional formatting rule'>
            <XIcon 
                onClick={(e) => {
                    e.stopPropagation();
                    props.onDelete()
                }}
            ></XIcon>
        </Col>
    );
            
    if (!props.isExpanded) {
        // If this is not the open card
        return (
            <div className='expandable-content-card' onClick={() => props.setExpanded(true)}> 
                <Row suppressTopBottomMargin align='center' justify='start'>
                    {props.icon !== undefined && 
                        <Col offsetRight={1} title={props.iconTitle}>
                            {props.icon}
                        </Col>
                    }
                    <Col span={17.5}>
                        <div className='flex flex-column'>
                            <p className='text-body-1'>
                                {props.title}
                            </p>
                            <p className='text-body-2'>
                                {props.subtitle}
                            </p>
                        </div>
                    </Col>
                    {/** So the spacing works out */}
                    {props.icon === undefined && 
                        <Col offsetRight={4}></Col>
                    }
                    <Col>
                        <Row align='top' justify='end' suppressTopBottomMargin>
                            <Col className='mr-5px'>
                                <UpArrowIcon/>
                            </Col>
                            {XElement}
                        </Row>
                    </Col>
                </Row>
            </div>
        )
    } else {
        return (
            <div className='expandable-content-card'> 
                <Row justify='space-between' onClick={() => props.setExpanded(false)}>
                    <Col span={22}>
                        <p className='text-header-3'>
                            {props.expandedTitle}
                        </p>
                    </Col>
                    <Row justify='end'>
                        <Col className='mr-5px'>
                            <DownArrowIcon/>
                        </Col>
                        {XElement}
                    </Row>
                </Row>
                {props.children}
            </div>
        )
    }
}

export default ExpandableContentCard;
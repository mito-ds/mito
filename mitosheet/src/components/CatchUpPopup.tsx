// Copyright (c) Mito

import React from 'react';
import "../../css/CatchUpPopup.css";
import Col from './spacing/Col';
import Row from './spacing/Row';
import CatchUpIcon from './icons/CatchUpIcon';

/*
    A small upper-left modal that displays a message to the user
    to let them know to fast forward
*/
const FastForwardPopup = (props: {fastForward: () => void}): JSX.Element => {

    return (
        <div 
            onClick={props.fastForward}
            className='catch-up-popup-container'
        >
            <Row>
                <Col>
                    <p className='text-overflow-wrap'>
                        You are viewing a previous step, and cannot make any edits.
                    </p>
                </Col>
            </Row>
            <Row>
                <Col>
                    <CatchUpIcon variant='light'/>
                </Col>
                <Col offset={1}>
                    <p>
                        <span className='text-underline'> Catch up</span> to start editing.
                    </p>                    
                </Col>
            </Row>
            
        </div>
    );
};

export default FastForwardPopup;
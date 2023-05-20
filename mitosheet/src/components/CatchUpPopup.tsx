// Copyright (c) Mito

import React from 'react';
import "../../css/CatchUpPopup.css";
import Col from './layout/Col';
import Row from './layout/Row';
import CatchUpIcon from './icons/CatchUpIcon';

/*
    A small upper-left modal that displays a message to the user
    to let them know to fast forward
*/
const CatchUpPopup = (props: {
    fastForward: () => void,
    deleteStepsAfterIdx: () => void
}): JSX.Element => {

    return (
        <div 
            className='catch-up-popup-container'
        >
            <Row>
                <Col>
                    <p className='text-overflow-wrap'>
                        You are viewing a previous step, and cannot make any edits.
                    </p>
                </Col>
            </Row>
            <Row onClick={props.fastForward} >
                <Col>
                    <CatchUpIcon variant='light'/>
                </Col>
                <Col offset={1}>
                    <p>
                        <span className='text-underline'> Catch up</span> to continue analysis.
                    </p>                    
                </Col>
            </Row>
            <Row onClick={props.deleteStepsAfterIdx}>
                <Col>
                    <CatchUpIcon variant='light'/>
                </Col>
                <Col offset={1}>
                    <p>
                        <span className='text-underline'> Delete hidden steps </span> to work from here.
                    </p>                    
                </Col>
            </Row>
        </div>
    );
};

export default CatchUpPopup;
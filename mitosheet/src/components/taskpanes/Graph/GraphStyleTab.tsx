// Copyright (c) Saga Inc.

import React, { Fragment, useEffect, useState } from 'react';
import { GraphParams, GraphStylingParams } from '../../../types';
import Input from '../../elements/Input';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';

/* 
    The tabs at the bottom of the column control panel that allows users to switch
    from sort/filter to seeing summary statistics about the column
*/
function GraphStyleTab(props: {
    graphParams: GraphParams
    setGraphParams: React.Dispatch<React.SetStateAction<GraphParams>>;
    setGraphUpdatedNumber: React.Dispatch<React.SetStateAction<number>>;
}): JSX.Element {

    const [graphStylingParams, setGraphStylingParams] = useState<GraphStylingParams>(props.graphParams.graphStyling)

    useEffect(() => {
        props.setGraphParams(prevGraphParams => {
            return {
                ...prevGraphParams,
                graphStyling: graphStylingParams
            }
        })
        props.setGraphUpdatedNumber(old => old + 1)
    }, [graphStylingParams])
    /*
    props.setGraphParams(prevGraphParams => {
        const newTitle = e.target.value ? "" : undefined
        return {
            ...prevGraphParams, 
            graphStyling: {
                ...prevGraphParams.graphStyling,
                title: newTitle
            }
        }
    })
    props.setGraphUpdatedNumber((old) => old + 1);
    */

    return ( 
        <Fragment>        
            <div className='text-header-2'>
                Title
            </div>
            <Row>
                <Col>
                    <p>
                        Title
                    </p>
                </Col>
                <Input 
                    value={graphStylingParams.title || ''}
                    placeholder="Default Graph Title"
                    onChange={(e) => {
                        setGraphStylingParams(prevGraphStylingParams => {
                            return {
                                ...prevGraphStylingParams, 
                                title: e.target.value !== '' ? e.target.value : undefined
                            }
                        })
                    }}
                />
            </Row>
        </Fragment> 
        
    )
} 

export default GraphStyleTab;
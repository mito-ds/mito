// Copyright (c) Saga Inc.

import React, { Fragment, useEffect, useState } from 'react';
import { GraphParams, GraphStylingParams } from '../../../types';
import Input from '../../elements/Input';
import Toggle from '../../elements/Toggle';
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
    console.log(graphStylingParams)


    useEffect(() => {
        props.setGraphParams(prevGraphParams => {
            return {
                ...prevGraphParams,
                graphStyling: graphStylingParams
            }
        })
        props.setGraphUpdatedNumber(old => old + 1)
    }, [graphStylingParams])


    return ( 
        <Fragment>        
            <div className='text-header-2'>
                Title
            </div>
            <Row justify='space-between' align='center'>
                <Col>
                    <p>
                        Title
                    </p>
                </Col>
                <Input 
                    value={graphStylingParams.title.title || ''}
                    placeholder="Default Graph Title"
                    onChange={(e) => {
                        setGraphStylingParams(prevGraphStylingParams => {
                            return {
                                ...prevGraphStylingParams, 
                                title: {
                                    ...prevGraphStylingParams.title,
                                    title: e.target.value !== '' ? e.target.value : undefined
                                } 
                            }
                        })
                    }}
                />
            </Row>
            <Row justify='space-between' align='center'>
                <Col>
                    <p>
                        Display title
                    </p>
                </Col>
                <Toggle 
                    value={graphStylingParams.title.visible} 
                    onChange={() => {
                        setGraphStylingParams(prevGraphStylingParams => {
                            return {
                                ...prevGraphStylingParams,
                                title: {
                                    ...prevGraphStylingParams.title,
                                    visible: !prevGraphStylingParams.title.visible
                                }
                            }
                        })
                    }}     
                />
            </Row>
            <div className='text-header-2'>
                X Axis
            </div>
            <Row justify='space-between' align='center'>
                <Col>
                    <p>
                        X axis title
                    </p>
                </Col>
                <Input 
                    value={graphStylingParams.xaxis.title || ''}
                    placeholder="Default X Axis"
                    onChange={(e) => {
                        setGraphStylingParams(prevGraphStylingParams => {
                            return {
                                ...prevGraphStylingParams, 
                                xaxis: {
                                    ...prevGraphStylingParams.xaxis, 
                                    title: e.target.value !== '' ? e.target.value : undefined
                                }
                            }
                        })
                    }}
                />
            </Row>
            <Row justify='space-between' align='center'>
                <Col>
                    <p>
                        Display x axis title
                    </p>
                </Col>
                <Toggle 
                    value={graphStylingParams.xaxis.visible} 
                    onChange={() => {
                        setGraphStylingParams(prevGraphStylingParams => {
                            return {
                                ...prevGraphStylingParams,
                                xaxis: {
                                    ...prevGraphStylingParams.xaxis,
                                    visible: !prevGraphStylingParams.xaxis.visible
                                }
                            }
                        })
                    }}     
                />
            </Row>
            <Row justify='space-between' align='center'>
                <Col>
                    <p>
                        Display range slider
                    </p>
                </Col>
                <Toggle 
                    value={graphStylingParams.xaxis.rangeslider.visible} 
                    onChange={() => {
                        setGraphStylingParams(prevGraphStylingParams => {
                            return {
                                ...prevGraphStylingParams,
                                xaxis: {
                                    ...prevGraphStylingParams.xaxis,
                                    rangeslider: {
                                        visible: !prevGraphStylingParams.xaxis.rangeslider.visible
                                    } 
                                }
                            }
                        })
                    }}     
                />
            </Row>
            <div className='text-header-2'>
                Y Axis
            </div>
            <Row justify='space-between' align='center'>
                <Col>
                    <p>
                        Y axis title
                    </p>
                </Col>
                <Input 
                    value={graphStylingParams.yaxis.title || ''}
                    placeholder="Default Y Axis"
                    onChange={(e) => {
                        setGraphStylingParams(prevGraphStylingParams => {
                            return {
                                ...prevGraphStylingParams, 
                                yaxis: {
                                    ...prevGraphStylingParams.yaxis, 
                                    title: e.target.value !== '' ? e.target.value : undefined
                                }
                            }
                        })
                    }}
                />
            </Row>
            <Row justify='space-between' align='center'>
                <Col>
                    <p>
                        Display y axis title
                    </p>
                </Col>
                <Toggle 
                    value={graphStylingParams.yaxis.visible} 
                    onChange={() => {
                        setGraphStylingParams(prevGraphStylingParams => {
                            return {
                                ...prevGraphStylingParams,
                                yaxis: {
                                    ...prevGraphStylingParams.yaxis,
                                    visible: !prevGraphStylingParams.yaxis.visible
                                }
                            }
                        })
                    }}     
                />
            </Row>

        </Fragment> 
        
    )
} 

export default GraphStyleTab;




// Copyright (c) Saga Inc.

import React, { useEffect, useRef, useState } from 'react';
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

    const firstUpdate = useRef(true);
    useEffect(() => {
        // Don't refresh the graph when the user switches to the graph styling tab
        if (!firstUpdate.current) {
            props.setGraphParams(prevGraphParams => {
                const graphParamsCopy = JSON.parse(JSON.stringify(prevGraphParams)); 
                return {
                    ...graphParamsCopy,
                    graphStyling: graphStylingParams
                }
            })
            props.setGraphUpdatedNumber(old => old + 1)
        } else {
            firstUpdate.current = false
        }
        
    }, [graphStylingParams])


    return ( 
        <div className='graph-sidebar-toolbar-content'>   
            <div>
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
                                const graphStylingParamsCopy = JSON.parse(JSON.stringify(prevGraphStylingParams)); 
                                return {
                                    ...graphStylingParamsCopy, 
                                    title: {
                                        ...graphStylingParamsCopy.title,
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
                                const graphStylingParamsCopy = JSON.parse(JSON.stringify(prevGraphStylingParams)); 
                                return {
                                    ...graphStylingParamsCopy,
                                    title: {
                                        ...graphStylingParamsCopy.title,
                                        visible: !graphStylingParamsCopy.title.visible
                                    }
                                }
                            })
                        }}     
                    />
                </Row>
            </div>
            <div>
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
                                const graphStylingParamsCopy = JSON.parse(JSON.stringify(prevGraphStylingParams)); 
                                return {
                                    ...graphStylingParamsCopy, 
                                    xaxis: {
                                        ...graphStylingParamsCopy.xaxis, 
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
                                const graphStylingParamsCopy = JSON.parse(JSON.stringify(prevGraphStylingParams)); 
                                return {
                                    ...graphStylingParamsCopy,
                                    xaxis: {
                                        ...graphStylingParamsCopy.xaxis,
                                        visible: !graphStylingParamsCopy.xaxis.visible
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
                                const graphStylingParamsCopy = JSON.parse(JSON.stringify(prevGraphStylingParams)); 
                                return {
                                    ...graphStylingParamsCopy,
                                    xaxis: {
                                        ...graphStylingParamsCopy.xaxis,
                                        rangeslider: {
                                            visible: !graphStylingParamsCopy.xaxis.rangeslider.visible
                                        } 
                                    }
                                }
                            })
                        }}     
                    />
                </Row>
            </div>
            <div>
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
                                const graphStylingParamsCopy = JSON.parse(JSON.stringify(prevGraphStylingParams)); 
                                return {
                                    ...graphStylingParamsCopy, 
                                    yaxis: {
                                        ...graphStylingParamsCopy.yaxis, 
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
                                const graphStylingParamsCopy = JSON.parse(JSON.stringify(prevGraphStylingParams)); 
                                return {
                                    ...graphStylingParamsCopy,
                                    yaxis: {
                                        ...graphStylingParamsCopy.yaxis,
                                        visible: !graphStylingParamsCopy.yaxis.visible
                                    }
                                }
                            })
                        }}     
                    />
                </Row>
            </div>
            <div>
                <div className='text-header-2'>
                    Legend
                </div>
                <Row justify='space-between' align='center'>
                    <Col>
                        <p>
                            Display Legend
                        </p>
                    </Col>
                    <Toggle 
                        value={graphStylingParams.showlegend} 
                        onChange={() => {
                            setGraphStylingParams(prevGraphStylingParams => {
                                const graphStylingParamsCopy = JSON.parse(JSON.stringify(prevGraphStylingParams)); 
                                return {
                                    ...graphStylingParamsCopy,
                                    showlegend: !graphStylingParamsCopy.showlegend

                                }
                            })
                        }}     
                    />
                </Row>
            </div>
        </div> 
    )
} 

export default GraphStyleTab;




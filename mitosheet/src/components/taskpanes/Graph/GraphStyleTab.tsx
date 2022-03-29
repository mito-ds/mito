// Copyright (c) Saga Inc.

import React from 'react';
import LabelAndColor from '../../../pro/graph/LabelAndColor';
import { GraphParams, UserProfile } from '../../../types';
import Input from '../../elements/Input';
import Toggle from '../../elements/Toggle';
import Col from '../../spacing/Col';
import Row from '../../spacing/Row';

/* 
    Contains all of the options for styling graphs,
    like setting the title and axis labels
*/
function GraphStyleTab(props: {
    graphParams: GraphParams
    setGraphParams: React.Dispatch<React.SetStateAction<GraphParams>>;
    setGraphUpdatedNumber: React.Dispatch<React.SetStateAction<number>>;
    userProfile: UserProfile
}): JSX.Element {

    const graphStylingParams = props.graphParams.graphStyling

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
                            props.setGraphParams(prevGraphParams => {
                                const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams));
                                // We set it to undefined so that the backend knows we're not trying to set a custom axis label 
                                const newTitle =  e.target.value !== '' ? e.target.value : undefined
                                return {
                                    ...graphParamsCopy,
                                    graphStyling: {
                                        ...graphParamsCopy.graphStyling,
                                        title: {
                                            ...graphParamsCopy.graphStyling.title,
                                            title: newTitle
                                        } 
                                    } 
                                }
                            })
                            props.setGraphUpdatedNumber(old => old + 1)
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
                            props.setGraphParams(prevGraphParams => {
                                const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                return {
                                    ...graphParamsCopy,
                                    graphStyling: {
                                        ...graphParamsCopy.graphStyling,
                                        title: {
                                            ...graphParamsCopy.graphStyling.title,
                                            visible: !graphParamsCopy.graphStyling.title.visible
                                        } 
                                    } 
                                }
                            })
                            props.setGraphUpdatedNumber(old => old + 1)
                        }}     
                    />
                </Row>
                {props.userProfile.isPro && 
                    <LabelAndColor
                        label='Title color'
                        color={graphStylingParams.title.title_font_color}
                        onChange={(newColor) => {
                            props.setGraphParams(prevGraphParams => {
                                const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                return {
                                    ...graphParamsCopy,
                                    graphStyling: {
                                        ...graphParamsCopy.graphStyling,
                                        title: {
                                            ...graphParamsCopy.graphStyling.title,
                                            title_font_color: newColor
                                        } 
                                    } 
                                }
                            })
                            props.setGraphUpdatedNumber(old => old + 1)
                        }}
                    />
                }
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
                            props.setGraphParams(prevGraphParams => {
                                const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                // We set it to undefined so that the backend knows we're not trying to set a custom axis label 
                                const newTitle =  e.target.value !== '' ? e.target.value : undefined
                                return {
                                    ...graphParamsCopy,
                                    graphStyling: {
                                        ...graphParamsCopy.graphStyling,
                                        xaxis: {
                                            ...graphParamsCopy.graphStyling.xaxis,
                                            title: newTitle
                                        } 
                                    } 
                                }
                            })
                            props.setGraphUpdatedNumber(old => old + 1)
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
                            props.setGraphParams(prevGraphParams => {
                                const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                return {
                                    ...graphParamsCopy,
                                    graphStyling: {
                                        ...graphParamsCopy.graphStyling,
                                        xaxis: {
                                            ...graphParamsCopy.graphStyling.xaxis,
                                            visible: !graphParamsCopy.graphStyling.xaxis.visible
                                        } 
                                    } 
                                }
                            })
                            props.setGraphUpdatedNumber(old => old + 1)
                        }}     
                    />
                </Row>
                {props.userProfile.isPro && 
                    <LabelAndColor
                        label='X axis title color'
                        color={graphStylingParams.xaxis.title_font_color}
                        onChange={(newColor) => {
                            props.setGraphParams(prevGraphParams => {
                                const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                return {
                                    ...graphParamsCopy,
                                    graphStyling: {
                                        ...graphParamsCopy.graphStyling,
                                        xaxis: {
                                            ...graphParamsCopy.graphStyling.xaxis,
                                            title_font_color: newColor
                                        } 
                                    } 
                                }
                            })
                            props.setGraphUpdatedNumber(old => old + 1)
                        }}
                    />
                }
                <Row justify='space-between' align='center'>
                    <Col>
                        <p>
                            Display range slider
                        </p>
                    </Col>
                    <Toggle 
                        value={graphStylingParams.xaxis.rangeslider.visible} 
                        onChange={() => {
                            props.setGraphParams(prevGraphParams => {
                                const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                return {
                                    ...graphParamsCopy,
                                    graphStyling: {
                                        ...graphParamsCopy.graphStyling,
                                        xaxis: {
                                            ...graphParamsCopy.graphStyling.xaxis,
                                            rangeslider: {
                                                visible: !graphParamsCopy.graphStyling.xaxis.rangeslider.visible
                                            }
                                        } 
                                    } 
                                }
                            })
                            props.setGraphUpdatedNumber(old => old + 1)
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
                            props.setGraphParams(prevGraphParams => {
                                const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                const newTitle = e.target.value !== '' ? e.target.value : undefined
                                return {
                                    ...graphParamsCopy,
                                    graphStyling: {
                                        ...graphParamsCopy.graphStyling,
                                        yaxis: {
                                            ...graphParamsCopy.graphStyling.yaxis,
                                            title: newTitle
                                        } 
                                    } 
                                }
                            })
                            props.setGraphUpdatedNumber(old => old + 1)
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
                            props.setGraphParams(prevGraphParams => {
                                const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                return {
                                    ...graphParamsCopy,
                                    graphStyling: {
                                        ...graphParamsCopy.graphStyling,
                                        yaxis: {
                                            ...graphParamsCopy.graphStyling.yaxis,
                                            visible: !graphParamsCopy.graphStyling.yaxis.visible
                                        } 
                                    } 
                                }
                            })
                            props.setGraphUpdatedNumber(old => old + 1)
                        }}     
                    />
                </Row>
                {props.userProfile.isPro && 
                    <LabelAndColor
                        label='Y axis title color'
                        color={graphStylingParams.yaxis.title_font_color}
                        onChange={(newColor) => {
                            props.setGraphParams(prevGraphParams => {
                                const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                return {
                                    ...graphParamsCopy,
                                    graphStyling: {
                                        ...graphParamsCopy.graphStyling,
                                        yaxis: {
                                            ...graphParamsCopy.graphStyling.yaxis,
                                            title_font_color: newColor
                                        } 
                                    } 
                                }
                            })
                            props.setGraphUpdatedNumber(old => old + 1)
                        }}
                    />
                }
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
                            props.setGraphParams(prevGraphParams => {
                                const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                return {
                                    ...graphParamsCopy,
                                    graphStyling: {
                                        ...graphParamsCopy.graphStyling,
                                        showlegend: !graphParamsCopy.graphStyling.showlegend
                                    } 
                                }
                            })
                            props.setGraphUpdatedNumber(old => old + 1)
                        }}     
                    />
                </Row>
            </div>
            <div>
                <div className='text-header-2'>
                    Colors
                </div>
                {props.userProfile.isPro && 
                    <>
                        <LabelAndColor
                            label='Plot Background Color'
                            color={graphStylingParams.plot_bgcolor}
                            onChange={(newColor) => {
                                props.setGraphParams(prevGraphParams => {
                                    const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                    return {
                                        ...graphParamsCopy,
                                        graphStyling: {
                                            ...graphParamsCopy.graphStyling,
                                            plot_bgcolor: newColor
                                        } 
                                    }
                                })
                                props.setGraphUpdatedNumber(old => old + 1)
                            }}
                        />
                        <LabelAndColor
                            label='Paper Background Color'
                            color={graphStylingParams.paper_bgcolor}
                            onChange={(newColor) => {
                                props.setGraphParams(prevGraphParams => {
                                    const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                    return {
                                        ...graphParamsCopy,
                                        graphStyling: {
                                            ...graphParamsCopy.graphStyling,
                                            paper_bgcolor: newColor
                                        } 
                                    }
                                })
                                props.setGraphUpdatedNumber(old => old + 1)
                            }}
                        />
                    </>
                }
                {!props.userProfile.isPro && 
                    <Row justify='space-between' align='center'>
                        <p className='text-body-1'>
                            Want to set the colors of the background and text of your graph? <a href='https://trymito.io/plans' target='_blank' rel="noreferrer"><span className='text-body-1-link'>Upgrade to Mito Pro.</span></a>
                        </p>  
                    </Row>                
                }
            </div>
        </div> 
    )
} 

export default GraphStyleTab;




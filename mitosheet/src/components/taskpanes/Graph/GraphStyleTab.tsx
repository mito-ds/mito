// Copyright (c) Saga Inc.

import React from 'react';
import LabelAndColor from '../../../pro/graph/LabelAndColor';
import { GraphParams, UserProfile } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import Input from '../../elements/Input';
import Select from '../../elements/Select';
import Toggle from '../../elements/Toggle';
import Col from '../../layout/Col';
import CollapsibleSection from '../../layout/CollapsibleSection';
import Row from '../../layout/Row';
import { GRAPHS_THAT_HAVE_BARMODE, GRAPHS_THAT_HAVE_BARNORM, GRAPHS_THAT_HAVE_HISTFUNC, GRAPHS_THAT_HAVE_HISTNORM, GRAPHS_THAT_HAVE_LINE_SHAPE, GRAPHS_THAT_HAVE_NBINS, GRAPHS_THAT_HAVE_POINTS} from './GraphSetupTab';
import { getGraphTypeFullName } from './graphUtils';

export enum AxisType {
    DEFAULT = 'default',
    LINEAR = 'linear',
    LOG = 'log',
    CATEGORY = 'category',
    DATE = 'date',
}

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

    const graphCreationParams = props.graphParams.graphCreation
    const graphStylingParams = props.graphParams.graphStyling

    return ( 
        <div className='graph-sidebar-toolbar-content'>   
            <CollapsibleSection title='Titles'>                
                <Row justify='space-between' align='center'>
                    <Col>
                        <p>
                            Graph Title
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
                            X Axis Title
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
                            Y Axis Title
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
                            Display Title
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
                <Row justify='space-between' align='center'>
                    <Col>
                        <p>
                            Display X Axis Title
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
                <Row justify='space-between' align='center'>
                    <Col>
                        <p>
                            Display Y Axis Title
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
            </CollapsibleSection>
            <CollapsibleSection title='Axis Transformations'>
                <Row justify='space-between' align='center'>
                    <Col>
                        <p>
                            X Axis Transform
                        </p>
                    </Col>
                    <Select
                        value={props.graphParams.graphStyling.xaxis.type || 'default'}
                        onChange={(xAxisType: string) => {
                            const newXAxisType = xAxisType !== AxisType.DEFAULT ? xAxisType : undefined
                            props.setGraphParams(prevGraphParams => {
                                const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                return {
                                    ...graphParamsCopy,
                                    graphStyling: {
                                        ...graphParamsCopy.graphStyling,
                                        xaxis: {
                                            ...graphParamsCopy.graphStyling.xaxis,
                                            type: newXAxisType
                                        } 
                                    } 
                                }
                            })
                            props.setGraphUpdatedNumber(old => old + 1)
                        }}
                        width='small'
                        dropdownWidth='medium'
                    >
                        <DropdownItem
                            title={AxisType.DEFAULT}
                        />
                        <DropdownItem
                            title={AxisType.LINEAR}
                        />
                        <DropdownItem
                            title={AxisType.LOG}
                        />
                        <DropdownItem
                            title={AxisType.DATE}
                        />
                        <DropdownItem
                            title={AxisType.CATEGORY}
                        />
                    </Select>
                </Row>
                <Row justify='space-between' align='center'>
                    <Col>
                        <p>
                            Y Axis Transform
                        </p>
                    </Col>
                    <Select
                        value={props.graphParams.graphStyling.yaxis.type || 'default'}
                        onChange={(yAxisType: string) => {
                            const newYAxisType = yAxisType !== AxisType.DEFAULT ? yAxisType : undefined
                            props.setGraphParams(prevGraphParams => {
                                const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                return {
                                    ...graphParamsCopy,
                                    graphStyling: {
                                        ...graphParamsCopy.graphStyling,
                                        yaxis: {
                                            ...graphParamsCopy.graphStyling.yaxis,
                                            type: newYAxisType
                                        } 
                                    } 
                                }
                            })
                            props.setGraphUpdatedNumber(old => old + 1)
                        }}
                        width='small'
                        dropdownWidth='medium'
                    >
                        <DropdownItem
                            title={AxisType.DEFAULT}
                        />
                        <DropdownItem
                            title={AxisType.LINEAR}
                        />
                        <DropdownItem
                            title={AxisType.LOG}
                        />
                        <DropdownItem
                            title={AxisType.DATE}
                        />
                        <DropdownItem
                            title={AxisType.CATEGORY}
                        />
                    </Select>
                </Row>
            </CollapsibleSection>
            <CollapsibleSection title={getGraphTypeFullName(graphCreationParams.graph_type) + ' configuration'}>
                {GRAPHS_THAT_HAVE_NBINS.includes(graphCreationParams.graph_type) && 
                    <Row justify='space-between' align='center' title='Number of bins in histogram'>
                        <Col>
                            <p>
                                Number of bins
                            </p>
                        </Col>
                        <Input
                            value={props.graphParams.graphCreation.nbins?.toString() || ''}
                            type='number'
                            placeholder='5'
                            onChange={(e) => {
                                const newNumberBins = e.target.value === '' ? undefined : e.target.value
                                props.setGraphParams(prevGraphParams => {
                                    const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                    return {
                                        ...graphParamsCopy,
                                        graphCreation: {
                                            ...graphParamsCopy.graphCreation,
                                            nbins: newNumberBins as number | undefined
                                        } 
                                    }
                                })
                                props.setGraphUpdatedNumber(old => old + 1)
                            }}
                            width='small'
                        />
                    </Row>
                }
                {GRAPHS_THAT_HAVE_BARMODE.includes(graphCreationParams.graph_type) && 
                    <Row justify='space-between' align='center'>
                        <Col>
                            <p>
                                Barmode
                            </p>
                        </Col>
                        <Select
                            value={props.graphParams.graphStyling.barmode || ''}
                            onChange={(newBarMode: string) => {
                                props.setGraphParams(prevGraphParams => {
                                    const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                    return {
                                        ...graphParamsCopy,
                                        graphStyling: {
                                            ...graphParamsCopy.graphStyling,
                                            barmode: newBarMode
                                        } 
                                    }
                                })
                                props.setGraphUpdatedNumber(old => old + 1)
                            }}
                            width='small'
                            dropdownWidth='medium'
                        >
                            <DropdownItem
                                title={'stack'}
                            />
                            <DropdownItem
                                title={'group'}
                            />
                            <DropdownItem
                                title={'overlay'}
                            />
                            <DropdownItem
                                title={'relative'}
                            />
                        </Select>
                    </Row>
                }
                {GRAPHS_THAT_HAVE_BARNORM.includes(graphCreationParams.graph_type) && 
                    <Row justify='space-between' align='center' title='Normalize bar traces on the graph'>
                        <Col>
                            <p>
                                Barnorm
                            </p>
                        </Col>
                        <Select
                            value={props.graphParams.graphStyling.barnorm || 'none'}
                            onChange={(newBarNorm: string) => {
                                props.setGraphParams(prevGraphParams => {
                                    const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                    return {
                                        ...graphParamsCopy,
                                        graphStyling: {
                                            ...graphParamsCopy.graphStyling,
                                            barnorm: newBarNorm === 'none' ? undefined : newBarNorm
                                        } 
                                    }
                                })
                                props.setGraphUpdatedNumber(old => old + 1)
                            }}
                            width='small'
                            dropdownWidth='medium'
                        >
                            <DropdownItem
                                title={'none'}
                            />
                            <DropdownItem
                                title={'fraction'}
                                subtext='value of each bar divided by the sum of all values at that location'
                            />
                            <DropdownItem
                                title={'percent'}
                                subtext='fraction multiplied by 100'
                            />
                        </Select>
                    </Row>
                }
                {GRAPHS_THAT_HAVE_HISTNORM.includes(graphCreationParams.graph_type) && 
                    <Row justify='space-between' align='center' title='The type of normalization used for this histogram trace'>
                        <Col>
                            <p>
                                Histnorm
                            </p>
                        </Col>
                        <Select
                            value={props.graphParams.graphCreation.histnorm || 'none'}
                            onChange={(newHistnorm: string) => {
                                props.setGraphParams(prevGraphParams => {
                                    const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                    return {
                                        ...graphParamsCopy,
                                        graphCreation: {
                                            ...graphParamsCopy.graphCreation,
                                            histnorm: newHistnorm === 'none' ? undefined : newHistnorm
                                        } 
                                    }
                                })
                                props.setGraphUpdatedNumber(old => old + 1)
                            }}
                            width='small'
                            dropdownWidth='medium'
                        >
                            <DropdownItem
                                title={'none'}
                            />
                            <DropdownItem
                                title={'probability'}
                                subtext='fraction occurence w.r.t total number of sample points'
                            />
                            <DropdownItem
                                title={'percent'}
                                subtext='probabilty multiplied by 100'
                            />
                            <DropdownItem
                                title={'density'}
                                subtext='occurences in bin divided by bin interval'
                            />
                            <DropdownItem
                                title={'probability density'}
                                subtext='probability that a point falls into bin'
                            />
                        </Select>
                    </Row>
                }
                {GRAPHS_THAT_HAVE_HISTFUNC.includes(graphCreationParams.graph_type) && 
                    <Row justify='space-between' align='center' title='The binning function for the historgram'>
                        <Col>
                            <p>
                                Histfunc
                            </p>
                        </Col>
                        <Select
                            value={props.graphParams.graphCreation.histfunc || ''}
                            onChange={(newHistfunc: string) => {
                                props.setGraphParams(prevGraphParams => {
                                    const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                    return {
                                        ...graphParamsCopy,
                                        graphCreation: {
                                            ...graphParamsCopy.graphCreation,
                                            histfunc: newHistfunc
                                        } 
                                    }
                                })
                                props.setGraphUpdatedNumber(old => old + 1)
                            }}
                            width='small'
                            dropdownWidth='medium'
                        >
                            <DropdownItem
                                title={'count'}
                                subtext='number of values in each bin'
                            />
                            <DropdownItem
                                title={'sum'}
                                subtext='sum of the values in each bin'
                            />
                            <DropdownItem
                                title={'avg'}
                                subtext='average value in each bin'
                            />
                            <DropdownItem
                                title={'min'}
                                subtext='min value in each bin'
                            />
                            <DropdownItem
                                title={'max'}
                                subtext='max value in each bin'
                            />
                        </Select>
                    </Row>
                }
                {GRAPHS_THAT_HAVE_POINTS.includes(graphCreationParams.graph_type) && 
                    <Row justify='space-between' align='center' title='Decide how to display outlier points'>
                        <Col>
                            <p>
                                Points
                            </p>
                        </Col>
                        <Select
                            value={props.graphParams.graphCreation.points === false ? 'false' : props.graphParams.graphCreation.points !== undefined ? props.graphParams.graphCreation.points : ''}
                            onChange={(newPointsString) => {
                                const newPointsParams = newPointsString === 'false' ? false : newPointsString
                                props.setGraphParams(prevGraphParams => {
                                    const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                    return {
                                        ...graphParamsCopy,
                                        graphCreation: {
                                            ...graphParamsCopy.graphCreation,
                                            points: newPointsParams
                                        } 
                                    }
                                })
                                props.setGraphUpdatedNumber(old => old + 1)
                            }}
                            width='small'
                            dropdownWidth='medium'
                        >
                            <DropdownItem
                                title={'outliers'}
                                subtext='only display sample points outside the whiskers'
                            />
                            <DropdownItem
                                title={'supsected outliers'}
                                id={'suspectedoutliers'}
                                subtext='display outlier and suspected outlier points'
                            />
                            <DropdownItem
                                title={'all'}
                                subtext='display all sample points'
                            />
                            <DropdownItem
                                title={'false'}
                                subtext='display no sample'
                            />
                        </Select>
                    </Row>
                }
                {GRAPHS_THAT_HAVE_LINE_SHAPE.includes(graphCreationParams.graph_type) && 
                    <Row justify='space-between' align='center' title='Set the shape of the lines in the chart'>
                        <Col>
                            <p>
                                Line shape
                            </p>
                        </Col>
                        <Select
                            value={props.graphParams.graphCreation.line_shape || ''}
                            onChange={(newLineShape) => {
                                props.setGraphParams(prevGraphParams => {
                                    const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                    return {
                                        ...graphParamsCopy,
                                        graphCreation: {
                                            ...graphParamsCopy.graphCreation,
                                            line_shape: newLineShape
                                        } 
                                    }
                                })
                                props.setGraphUpdatedNumber(old => old + 1)
                            }}
                            width='small'
                            dropdownWidth='medium'
                        >
                            <DropdownItem title={'linear'} />
                            <DropdownItem title={'spline'} />
                            <DropdownItem title={'hv'} />
                            <DropdownItem title={'vh'} />
                            <DropdownItem title={'hvh'} />
                            <DropdownItem title={'vhv'} />
                        </Select>
                    </Row>
                }
            </CollapsibleSection>
            <CollapsibleSection title='Legend'>
                {!props.userProfile.isPro &&
                    <Row justify='space-between' align='center'>
                        <p className='text-body-1'>
                            Want to customize the legend? <a href='https://trymito.io/plans' target='_blank' rel="noreferrer"><span className='text-body-1-link'>Upgrade to Mito Pro.</span></a>
                        </p>  
                    </Row>
                }
                {props.userProfile.isPro &&
                    <>
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
                        <Row justify='space-between' align='center' title='Set the legend vertical or horizontal'>
                            <Col>
                                <p>
                                    Orientation
                                </p>
                            </Col>
                            <Select 
                                value={graphStylingParams.legend.orientation === 'v' ? 'vertical' : 'horiztonal'} 
                                width='medium'
                                onChange={(newOrientation: string) => {
                                    props.setGraphParams(prevGraphParams => {
                                        const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                        return {
                                            ...graphParamsCopy,
                                            graphStyling: {
                                                ...graphParamsCopy.graphStyling,
                                                legend: {
                                                    ...graphParamsCopy.graphStyling.legend,
                                                    orientation:(newOrientation as 'v' | 'h')
                                                }
                                            } 
                                        }
                                    })
                                    props.setGraphUpdatedNumber(old => old + 1)
                                }}     
                            >   
                                <DropdownItem title='vertical' id='v' />
                                <DropdownItem title='horizontal' id='h' />
                            </Select>
                        </Row>
                        <Row justify='space-between' align='center' title='Title of legend'>
                            <Col>
                                <p>
                                    Legend title
                                </p>
                            </Col>
                            <Input 
                                value={graphStylingParams.legend.title.text ? graphStylingParams.legend.title.text : ''} 
                                width='medium'
                                placeholder='1'
                                onChange={(e) => {
                                    const newLegendTitle = e.target.value
                                    props.setGraphParams(prevGraphParams => {
                                        const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                        return {
                                            ...graphParamsCopy,
                                            graphStyling: {
                                                ...graphParamsCopy.graphStyling,
                                                legend: {
                                                    ...graphParamsCopy.graphStyling.legend,
                                                    title: {
                                                        ...graphParamsCopy.graphStyling.legend.title,
                                                        text: newLegendTitle
                                                    }
                                                }
                                            } 
                                        }
                                    })
                                    props.setGraphUpdatedNumber(old => old + 1)
                                }}     
                            />
                        </Row>
                        <Row justify='space-between' align='center' title='The x position of the legend'>
                            <Col>
                                <p>
                                    X position
                                </p>
                            </Col>
                            <Input 
                                value={graphStylingParams.legend.x ? graphStylingParams.legend.x.toString() : ''} 
                                type='number'
                                width='small'
                                // Set default according the https://plotly.com/python/reference/layout/#layout-legend-x
                                placeholder={graphStylingParams.legend.orientation === 'v' ? '1.02' : '0.00'}
                                onChange={(e) => {
                                    const newX = e.target.value === '' ? undefined : e.target.value
                                    props.setGraphParams(prevGraphParams => {
                                        const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                        return {
                                            ...graphParamsCopy,
                                            graphStyling: {
                                                ...graphParamsCopy.graphStyling,
                                                legend: {
                                                    ...graphParamsCopy.graphStyling.legend,
                                                    x: (newX as number | undefined)
                                                }
                                            } 
                                        }
                                    })
                                    props.setGraphUpdatedNumber(old => old + 1)
                                }}     
                            />
                        </Row>
                        <Row justify='space-between' align='center' title='The y position of the legend'>
                            <Col>
                                <p>
                                    Y position
                                </p>
                            </Col>
                            <Input 
                                value={graphStylingParams.legend.y ? graphStylingParams.legend.y.toString() : ''} 
                                type='number'
                                width='small'
                                // Set default according the https://plotly.com/python/reference/layout/#layout-legend-y
                                placeholder={graphStylingParams.legend.orientation === 'v' ? '1.00' : graphStylingParams.xaxis.rangeslider.visible ? '1.10' : "-0.10"}
                                onChange={(e) => {
                                    const newY = e.target.value === '' ? undefined : e.target.value
                                    props.setGraphParams(prevGraphParams => {
                                        const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                        return {
                                            ...graphParamsCopy,
                                            graphStyling: {
                                                ...graphParamsCopy.graphStyling,
                                                legend: {
                                                    ...graphParamsCopy.graphStyling.legend,
                                                    y: (newY as number | undefined)
                                                }
                                            } 
                                        }
                                    })
                                    props.setGraphUpdatedNumber(old => old + 1)
                                }}     
                            />
                        </Row>
                    </>
                }
            </CollapsibleSection>
            <CollapsibleSection title='Grid Lines'>
                {!props.userProfile.isPro &&
                    <Row justify='space-between' align='center'>
                        <p className='text-body-1'>
                            Want to customize the grid lines? <a href='https://trymito.io/plans' target='_blank' rel="noreferrer"><span className='text-body-1-link'>Upgrade to Mito Pro.</span></a>
                        </p>  
                    </Row>
                }
                {props.userProfile.isPro &&
                    <>
                        <Row justify='space-between' align='center' title='Turn on/off vertical grid lines'>
                            <Col>
                                <p>
                                    Show vertical grid
                                </p>
                            </Col>
                            <Toggle 
                                value={graphStylingParams.xaxis.showgrid} 
                                onChange={() => {
                                    props.setGraphParams(prevGraphParams => {
                                        const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                        return {
                                            ...graphParamsCopy,
                                            graphStyling: {
                                                ...graphParamsCopy.graphStyling,
                                                xaxis: {
                                                    ...graphParamsCopy.graphStyling.xaxis,
                                                    showgrid: !graphParamsCopy.graphStyling.xaxis.showgrid
                                                }
                                            } 
                                        }
                                    })
                                    props.setGraphUpdatedNumber(old => old + 1)
                                }}     
                            />
                        </Row>
                        <Row justify='space-between' align='center' title='Turn on/off horiztonal grid lines'>
                            <Col>
                                <p>
                                    Show horizontal grid
                                </p>
                            </Col>
                            <Toggle 
                                value={graphStylingParams.yaxis.showgrid} 
                                onChange={() => {
                                    props.setGraphParams(prevGraphParams => {
                                        const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                        return {
                                            ...graphParamsCopy,
                                            graphStyling: {
                                                ...graphParamsCopy.graphStyling,
                                                yaxis: {
                                                    ...graphParamsCopy.graphStyling.yaxis,
                                                    showgrid: !graphParamsCopy.graphStyling.yaxis.showgrid
                                                }
                                            } 
                                        }
                                    })
                                    props.setGraphUpdatedNumber(old => old + 1)
                                }}     
                            />
                        </Row>
                        <Row justify='space-between' align='center' title='The width of the vertical grid lines'>
                            <Col>
                                <p>
                                    Vertical grid width
                                </p>
                            </Col>
                            <Input 
                                value={graphStylingParams.xaxis.gridwidth ? graphStylingParams.xaxis.gridwidth.toString() : ''} 
                                type='number'
                                width='small'
                                placeholder='1'
                                onChange={(e) => {
                                    const newHoriztonalGridWidth = e.target.value === '' ? undefined : e.target.value
                                    props.setGraphParams(prevGraphParams => {
                                        const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                        return {
                                            ...graphParamsCopy,
                                            graphStyling: {
                                                ...graphParamsCopy.graphStyling,
                                                xaxis: {
                                                    ...graphParamsCopy.graphStyling.xaxis,
                                                    gridwidth: (newHoriztonalGridWidth as number | undefined)
                                                }
                                            } 
                                        }
                                    })
                                    props.setGraphUpdatedNumber(old => old + 1)
                                }}     
                            />
                        </Row>
                        <Row justify='space-between' align='center' title='The width of the horizontal grid lines'>
                            <Col>
                                <p>
                                    Horizontal grid width
                                </p>
                            </Col>
                            <Input 
                                value={graphStylingParams.yaxis.gridwidth ? graphStylingParams.yaxis.gridwidth.toString() : ''} 
                                type='number'
                                width='small'
                                placeholder='1'
                                onChange={(e) => {
                                    const newHoriztonalGridWidth = e.target.value === '' ? undefined : e.target.value
                                    props.setGraphParams(prevGraphParams => {
                                        const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                        return {
                                            ...graphParamsCopy,
                                            graphStyling: {
                                                ...graphParamsCopy.graphStyling,
                                                yaxis: {
                                                    ...graphParamsCopy.graphStyling.yaxis,
                                                    gridwidth: (newHoriztonalGridWidth as number | undefined)
                                                }
                                            } 
                                        }
                                    })
                                    props.setGraphUpdatedNumber(old => old + 1)
                                }}     
                            />
                        </Row>
                    </>
                }
            </CollapsibleSection>
            
            <CollapsibleSection title='Colors'>
                {!props.userProfile.isPro &&
                    <Row justify='space-between' align='center'>
                        <p className='text-body-1'>
                            Want to set the colors of your graph? <a href='https://trymito.io/plans' target='_blank' rel="noreferrer"><span className='text-body-1-link'>Upgrade to Mito Pro.</span></a>
                        </p>  
                    </Row>
                }
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
                    </>
                }
            </CollapsibleSection>
            <CollapsibleSection title='Facet Styling'>
                {!props.userProfile.isPro &&
                    <Row justify='space-between' align='center'>
                        <p className='text-body-1'>
                            Want to style facet plots? <a href='https://trymito.io/plans' target='_blank' rel="noreferrer"><span className='text-body-1-link'>Upgrade to Mito Pro.</span></a>
                        </p>  
                    </Row>
                }
                {props.userProfile.isPro &&
                    <>
                        <Row justify='space-between' align='center' title='The number of plots to display per row. Has no effect when facet row is used.'>
                            <Col>
                                <p>
                                    Facet column wrap
                                </p>
                            </Col>
                            <Input 
                                value={graphCreationParams.facet_col_wrap ? graphCreationParams.facet_col_wrap.toString() : ''} 
                                type='number'
                                width='small'
                                placeholder='num cols'
                                onChange={(e) => {
                                    const newNumCols = e.target.value === '' ? undefined : e.target.value
                                    props.setGraphParams(prevGraphParams => {
                                        const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                        return {
                                            ...graphParamsCopy,
                                            graphCreation: {
                                                ...graphParamsCopy.graphCreation,
                                                facet_col_wrap: newNumCols as number | undefined
                                            } 
                                        }
                                    })
                                    props.setGraphUpdatedNumber(old => old + 1)
                                }}     
                            />
                        </Row>
                        <Row justify='space-between' align='center' title='The spacing between columns of facet plots. Set as a fraction of plotting area.'>
                            <Col>
                                <p>
                                    Facet column spacing
                                </p>
                            </Col>
                            <Input 
                                value={graphCreationParams.facet_col_spacing ? graphCreationParams.facet_col_spacing.toString() : ''} 
                                type='number'
                                width='small'
                                placeholder='.03'
                                onChange={(e) => {
                                    const newColSpacing = e.target.value === '' ? undefined : e.target.value
                                    props.setGraphParams(prevGraphParams => {
                                        const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                        return {
                                            ...graphParamsCopy,
                                            graphCreation: {
                                                ...graphParamsCopy.graphCreation,
                                                facet_col_spacing: newColSpacing as number | undefined
                                            } 
                                        }
                                    })
                                    props.setGraphUpdatedNumber(old => old + 1)
                                }}     
                            />
                        </Row>
                        <Row justify='space-between' align='center' title='The spacing between rows of facet plots. Set as a fraction of plotting area.'>
                            <Col>
                                <p>
                                    Facet row spacing
                                </p>
                            </Col>
                            <Input 
                                value={graphCreationParams.facet_row_spacing ? graphCreationParams.facet_row_spacing.toString() : ''} 
                                type='number'
                                width='small'
                                placeholder='.07'
                                onChange={(e) => {
                                    const newColSpacing = e.target.value === '' ? undefined : e.target.value
                                    props.setGraphParams(prevGraphParams => {
                                        const graphParamsCopy: GraphParams = JSON.parse(JSON.stringify(prevGraphParams)); 
                                        return {
                                            ...graphParamsCopy,
                                            graphCreation: {
                                                ...graphParamsCopy.graphCreation,
                                                facet_row_spacing: newColSpacing as number | undefined
                                            } 
                                        }
                                    })
                                    props.setGraphUpdatedNumber(old => old + 1)
                                }}     
                            />
                        </Row>
                    </>
                }
            </CollapsibleSection>
            <CollapsibleSection title='Legend and Zoom'>
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
            </CollapsibleSection>
        </div> 
    )
} 

export default GraphStyleTab;




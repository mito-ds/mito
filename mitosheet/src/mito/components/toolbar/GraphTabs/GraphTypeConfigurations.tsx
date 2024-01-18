import React from "react"
import { GraphParamsBackend, RecursivePartial } from "../../../types"
import DropdownItem from "../../elements/DropdownItem"
import Input from "../../elements/Input"
import LabelAndTooltip from "../../elements/LabelAndTooltip"
import Select from "../../elements/Select"
import { GRAPHS_THAT_HAVE_BARMODE, GRAPHS_THAT_HAVE_BARNORM, GRAPHS_THAT_HAVE_HISTFUNC, GRAPHS_THAT_HAVE_HISTNORM, GRAPHS_THAT_HAVE_LINE_SHAPE, GRAPHS_THAT_HAVE_NBINS, GRAPHS_THAT_HAVE_POINTS, GRAPHS_WITH_UNIQUE_CONFIG_OPTIONS } from "./ChangeChartTypeButton"

export const GraphTypeConfigurations = (
    props: {
        graphParams: GraphParamsBackend;
        updateGraphParam: (update: RecursivePartial<GraphParamsBackend>) => void;
    }) => {
    const configurationInputs = [];
    if (GRAPHS_WITH_UNIQUE_CONFIG_OPTIONS.includes(props.graphParams.graph_creation?.graph_type)) {
        if (GRAPHS_THAT_HAVE_NBINS.includes(props.graphParams.graph_creation?.graph_type)) {
            configurationInputs.push(<div className="mito-graph-configuration-option">
                <p>
                        Number of bins (int)
                </p>
                <Input
                    value={props.graphParams.graph_creation?.nbins?.toString() || ''}
                    type='number'
                    placeholder='5'
                    onChange={(e) => {
                        const newNumberBins = e.target.value === '' ? undefined : e.target.value
                        props.updateGraphParam({graph_creation: {nbins: +(newNumberBins ?? '')}})
                    }}
                    width='small'
                />
            </div>);
        }
        if (GRAPHS_THAT_HAVE_BARMODE.includes(props.graphParams.graph_creation?.graph_type)) {
            configurationInputs.push(<div className="mito-graph-configuration-option">
                <LabelAndTooltip tooltip='How bars are grouped together when there are multiple' textBody>
                        Bar mode
                </LabelAndTooltip>
                <Select
                    value={props.graphParams.graph_styling.barmode || 'group'}
                    onChange={(newBarMode: string) => {
                        props.updateGraphParam({graph_styling: {barmode: newBarMode}})
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
            </div>);
        }
        if (GRAPHS_THAT_HAVE_BARNORM.includes(props.graphParams.graph_creation?.graph_type)) { 
            configurationInputs.push(<div className="mito-graph-configuration-option">
                <LabelAndTooltip tooltip="Normalize strategy used for each group of bars at a specific location on the graph's domain" textBody>
                        Bar normalization
                </LabelAndTooltip>
                <Select
                    value={props.graphParams.graph_styling.barnorm || 'none'}
                    onChange={(newBarNorm: string) => {
                        if (newBarNorm === 'none') {
                            props.updateGraphParam({graph_styling: {barnorm: undefined}});
                            return;
                        }
                        props.updateGraphParam({graph_styling: {barnorm: newBarNorm}})
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
            </div>);
        }
        if (GRAPHS_THAT_HAVE_HISTNORM.includes(props.graphParams.graph_creation?.graph_type)) { 
            configurationInputs.push(<div className="mito-graph-configuration-option">
                <LabelAndTooltip tooltip='Normalization strategy used for each graphed series in the histogram' textBody>
                        Hist normalization
                </LabelAndTooltip>
                <Select
                    value={props.graphParams.graph_creation?.histnorm || 'none'}
                    onChange={(newHistnorm: string) => {
                        if (newHistnorm === 'none') {
                            props.updateGraphParam({graph_creation: {histnorm: undefined}});
                            return;
                        }
                        props.updateGraphParam({graph_creation: {histnorm: newHistnorm}})
                    }}
                    width='small'
                    dropdownWidth='medium'
                >
                    <DropdownItem
                        title={'none'}
                    />
                    <DropdownItem
                        title={'probability'}
                        subtext='occurrences in bin divided by total number of sample points'
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
            </div>);
        }
        if (GRAPHS_THAT_HAVE_HISTFUNC.includes(props.graphParams.graph_creation?.graph_type)) { 
            configurationInputs.push(<div className="mito-graph-configuration-option">
                <LabelAndTooltip tooltip='The metric displayed for each bin of data' textBody>
                        Hist Function
                </LabelAndTooltip>
                <Select
                    value={props.graphParams.graph_creation?.histfunc || 'count'}
                    onChange={(newHistfunc: string) => {
                        props.updateGraphParam({graph_creation: {histfunc: newHistfunc}})
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
                        subtext='sum of values in each bin'
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
            </div>);
        }
        if (GRAPHS_THAT_HAVE_POINTS.includes(props.graphParams.graph_creation?.graph_type)) { 
            configurationInputs.push(<div className="mito-graph-configuration-option">
                <p>
                        Points
                </p>
                <Select
                    value={props.graphParams.graph_creation?.points === false ? 'none' : props.graphParams.graph_creation?.points !== undefined ? props.graphParams.graph_creation?.points : ''}
                    onChange={(newPointsString) => {
                        const newPointsParams = newPointsString === 'false' ? false : newPointsString
                        props.updateGraphParam({graph_creation: {points: newPointsParams}})

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
                        title={'none'}
                        id='false'
                        subtext='display no individual sample points'
                    />
                </Select>
            </div>);
        }
        if (GRAPHS_THAT_HAVE_LINE_SHAPE.includes(props.graphParams.graph_creation?.graph_type)) { 
            configurationInputs.push(<div className="mito-graph-configuration-option">
                <p>
                        Line shape
                </p>
                <Select
                    value={props.graphParams.graph_creation?.line_shape || 'linear'}
                    onChange={(newLineShape) => {
                        props.updateGraphParam({graph_creation: {line_shape: newLineShape}})
                    }}
                    width='small'
                    dropdownWidth='medium'
                >
                    <DropdownItem 
                        title={'linear'} 
                        subtext='straight line between points'
                    />
                    <DropdownItem 
                        title={'spline'} 
                        subtext='spline interpolation between points'
                    />
                    <DropdownItem 
                        title={'hv'} 
                        subtext='horizontal vertical' 
                    />
                    <DropdownItem 
                        title={'vh'} 
                        subtext='veritical horizontal'
                    />
                    <DropdownItem
                        title={'hvh'}
                        subtext='horizontal vertical horizontal'
                    />
                    <DropdownItem 
                        title={'vhv'} 
                        subtext='vertical horizontal vertical'
                    />
                </Select>
            </div>);
        }
    }
        
    const configurationInputsWithSeparators = [];
    for (const [index, configurationInput] of configurationInputs.entries()) {
        // Add separators between every 2 inputs
        configurationInputsWithSeparators.push(configurationInput);
        if (index % 2 === 1 && index !== configurationInputs.length - 1) {
            configurationInputsWithSeparators.push(<div className='toolbar-vertical-line' />);
        }
    }

    return (
        configurationInputsWithSeparators.length === 0 ? 
            <></> :
            <div
                className='mito-graph-configuration-container'
                style={{
                    // NOTE: this is a hacky way to make the container the right width. Safari had issues with
                    // flexbox and wrapping, so this is a workaround.
                    width: `${(configurationInputsWithSeparators.length === 0 ? 1 : Math.ceil(configurationInputs.length / 2)) * 210}px`
                }}
            >
                <div className="toolbar-vertical-line" />
                    {configurationInputsWithSeparators}
                <div className="toolbar-vertical-line" />
            </div>
    );
}
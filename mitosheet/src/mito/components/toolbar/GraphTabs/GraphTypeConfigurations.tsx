import React from "react"
import { GraphParamsBackend, RecursivePartial } from "../../../types"
import DropdownItem from "../../elements/DropdownItem"
import Input from "../../elements/Input"
import Select from "../../elements/Select"
import { GRAPHS_THAT_HAVE_HISTFUNC, GRAPHS_THAT_HAVE_NBINS, GRAPHS_THAT_HAVE_POINTS, GRAPHS_WITH_UNIQUE_CONFIG_OPTIONS } from "./ChangeChartTypeButton"
import LabelAndTooltip from "../../elements/LabelAndTooltip"

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
                        if (newNumberBins === undefined || +newNumberBins < 0) return;
                        props.updateGraphParam({graph_creation: {nbins: +(newNumberBins ?? '')}})
                    }}
                    width='small'
                />
            </div>);
        }
        if (GRAPHS_THAT_HAVE_HISTFUNC.includes(props.graphParams.graph_creation?.graph_type)) { 
            configurationInputs.push(<div className="mito-graph-configuration-option">
                <LabelAndTooltip tooltip='The metric displayed for each bin of data' textBody>
                        Aggregation Type
                </LabelAndTooltip>
                <Select
                    value={props.graphParams.graph_creation?.histfunc || 'count'}
                    onChange={(newHistfunc: string) => {
                        props.updateGraphParam({graph_creation: {histfunc: newHistfunc}})
                    }}
                    width='medium'
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
                    width='medium'
                    dropdownWidth='medium'
                >
                    <DropdownItem
                        title={'outliers'}
                        subtext='only display sample points outside the whiskers'
                    />
                    <DropdownItem
                        title={'suspected outliers'}
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
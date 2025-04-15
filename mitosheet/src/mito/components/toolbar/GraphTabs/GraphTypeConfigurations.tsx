/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

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
                <p className="text-body-1" style={{ fontWeight: 'bold' }}>
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
                    style={{ width: '70px' }}
                />
            </div>);
        }
        if (GRAPHS_THAT_HAVE_HISTFUNC.includes(props.graphParams.graph_creation?.graph_type)) { 
            configurationInputs.push(<div className="mito-graph-configuration-option">
                <LabelAndTooltip style={{ fontWeight: 'bold' }} tooltip='The metric displayed for each bin of data' textBody>
                        Aggregation Type
                </LabelAndTooltip>
                <Select
                    value={props.graphParams.graph_creation?.histfunc || 'count'}
                    onChange={(newHistfunc: string) => {
                        props.updateGraphParam({graph_creation: {histfunc: newHistfunc}})
                    }}
                    style={{ width: '70px' }}
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
                <p style={{ fontWeight: 'bold' }}>
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

    return (
        configurationInputs.length === 0 ? 
            <></> :
            <div className='mito-graph-configuration-container'>
                {configurationInputs}
            </div>
    );
}
/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import '../../../../../css/taskpanes/Graph/ChartStudioChartPicker.css';
import React, { useEffect, useState } from 'react';
import { GraphParamsFrontend } from '../../../types';
import { classNames } from '../../../utils/classNames';
import DensityContourIcon from '../../icons/GraphToolbar/DensityContourIcon';
import HeatMapIcon from '../../icons/GraphToolbar/HeatMapIcon';
import HistogramIcon from '../../icons/GraphToolbar/HistogramIcon';
import BoxPlotSubMenuIcon from '../../icons/GraphToolbar/BoxPlotSubMenuIcon';
import GraphIcon from '../../icons/GraphIcon';
import LineChartIcon from '../../icons/LineChartIcon';
import ScatterPlotIcon from '../../icons/ScatterPlotIcon';
import {
    GRAPHS_THAT_HAVE_BARMODE,
    GRAPHS_THAT_HAVE_HISTFUNC,
    GRAPHS_THAT_HAVE_LINE_SHAPE,
    GRAPHS_THAT_HAVE_POINTS,
} from '../../toolbar/GraphTabs/ChangeChartTypeButton';
import { GraphType } from './GraphSetupTab';

const GRAPHS_THAT_DONT_SUPPORT_COLOR = [GraphType.DENSITY_HEATMAP];

function applyGraphTypeChangeToParams(prev: GraphParamsFrontend, newType: GraphType): GraphParamsFrontend {
    const copy = structuredClone(prev);
    if (copy.graphCreation.graph_type === newType) {
        return prev;
    }
    copy.graphCreation.graph_type = newType;
    copy.graphCreation.color = GRAPHS_THAT_DONT_SUPPORT_COLOR.includes(newType) ? undefined : copy.graphCreation.color;
    copy.graphCreation.points = GRAPHS_THAT_HAVE_POINTS.includes(newType) ? 'outliers' : undefined;
    copy.graphCreation.line_shape = GRAPHS_THAT_HAVE_LINE_SHAPE.includes(newType) ? 'linear' : undefined;
    copy.graphCreation.nbins = undefined;
    copy.graphCreation.histnorm = undefined;
    copy.graphCreation.histfunc = GRAPHS_THAT_HAVE_HISTFUNC.includes(newType) ? 'count' : undefined;
    if (GRAPHS_THAT_HAVE_BARMODE.includes(newType)) {
        copy.graphStyling.barmode = copy.graphStyling.barmode ?? 'group';
    } else {
        copy.graphStyling.barmode = undefined;
        copy.graphStyling.barnorm = undefined;
    }
    return copy;
}

const CHART_STUDIO_TYPES: { graphType: GraphType; label: string; renderIcon: () => JSX.Element }[] = [
    { graphType: GraphType.BAR, label: 'Bar', renderIcon: () => <GraphIcon /> },
    { graphType: GraphType.LINE, label: 'Line', renderIcon: () => <LineChartIcon /> },
    { graphType: GraphType.SCATTER, label: 'Scatter', renderIcon: () => <ScatterPlotIcon /> },
    { graphType: GraphType.HISTOGRAM, label: 'Histogram', renderIcon: () => <HistogramIcon /> },
    { graphType: GraphType.BOX, label: 'Box', renderIcon: () => <BoxPlotSubMenuIcon type='box' /> },
    { graphType: GraphType.VIOLIN, label: 'Violin', renderIcon: () => <BoxPlotSubMenuIcon type='violin' /> },
    { graphType: GraphType.STRIP, label: 'Strip', renderIcon: () => <ScatterPlotIcon /> },
    { graphType: GraphType.ECDF, label: 'ECDF', renderIcon: () => <BoxPlotSubMenuIcon type='ecdf' /> },
    { graphType: GraphType.DENSITY_HEATMAP, label: 'Heatmap', renderIcon: () => <HeatMapIcon width='36px' /> },
    { graphType: GraphType.DENSITY_CONTOUR, label: 'Contour', renderIcon: () => <DensityContourIcon width='36px' /> },
];

const ChartStudioChartPicker = (props: {
    graphParams: GraphParamsFrontend;
    setGraphParams: React.Dispatch<React.SetStateAction<GraphParamsFrontend>>;
}): JSX.Element => {
    const currentType = props.graphParams.graphCreation.graph_type;

    const [committedGraphType, setCommittedGraphType] = useState<GraphType>(() => props.graphParams.graphCreation.graph_type);
    const [isHoverPreviewing, setIsHoverPreviewing] = useState(false);

    useEffect(() => {
        setCommittedGraphType(props.graphParams.graphCreation.graph_type);
        setIsHoverPreviewing(false);
    }, [props.graphParams.graphID]);

    useEffect(() => {
        if (isHoverPreviewing) {
            return;
        }
        setCommittedGraphType(props.graphParams.graphCreation.graph_type);
    }, [props.graphParams.graphCreation.graph_type, isHoverPreviewing]);

    const revertPreview = (committed: GraphType) => {
        props.setGraphParams((prev) => applyGraphTypeChangeToParams(prev, committed));
        setIsHoverPreviewing(false);
    };

    return (
        <div className='chart-studio-picker'>
            <p className='text-body-2 chart-studio-picker-hint'>Chart</p>
            <div
                className='chart-studio-icon-grid'
                onMouseLeave={() => {
                    if (isHoverPreviewing) {
                        revertPreview(committedGraphType);
                    }
                }}
            >
                {CHART_STUDIO_TYPES.map((entry, idx) => {
                    const isCommitted = committedGraphType === entry.graphType;
                    const isPreviewTarget =
                        isHoverPreviewing && currentType === entry.graphType && entry.graphType !== committedGraphType;
                    return (
                        <button
                            key={`${entry.graphType}-${entry.label}-${idx}`}
                            type='button'
                            className={classNames('chart-studio-type-btn', {
                                'chart-studio-type-btn-selected': isCommitted,
                                'chart-studio-type-btn-hover-preview': isPreviewTarget,
                            })}
                            title={entry.label}
                            onClick={() => {
                                setCommittedGraphType(entry.graphType);
                                setIsHoverPreviewing(false);
                                props.setGraphParams((prev) => applyGraphTypeChangeToParams(prev, entry.graphType));
                            }}
                            onMouseEnter={() => {
                                if (entry.graphType === committedGraphType) {
                                    if (isHoverPreviewing) {
                                        revertPreview(committedGraphType);
                                    }
                                    return;
                                }
                                setIsHoverPreviewing(true);
                                props.setGraphParams((prev) => applyGraphTypeChangeToParams(prev, entry.graphType));
                            }}
                        >
                            {entry.renderIcon()}
                            <span className='chart-studio-type-label'>{entry.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ChartStudioChartPicker;

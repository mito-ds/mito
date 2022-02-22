// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import MitoAPI from '../../../api';
import XIcon from '../../icons/XIcon';
import { GraphType } from './GraphSidebar';
import Select from '../../elements/Select';
import DropdownButton from '../../elements/DropdownButton';
import Row from '../../spacing/Row';
import Col from '../../spacing/Col';

import '../../../../css/taskpanes/Graph/AxisSection.css'
import { ColumnID, ColumnIDsMap } from '../../../types';
import DropdownItem from '../../elements/DropdownItem';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import { isNumberDtype } from '../../../utils/dtypes';


export enum GraphAxisType {
    X_AXIS = 'X axis',
    Y_AXIS = 'Y axis'
}

/*
    The Axis Section contains all of the fields needed to manipulate the selected 
    column headers for each axis of the graph. 
*/
const AxisSection = (props: {
    columnIDsMap: ColumnIDsMap;
    columnDtypesMap: Record<string, string>;

    graphType: GraphType;
    graphAxis: GraphAxisType;
    selectedColumnIDs: ColumnID[];
    otherAxisSelectedColumnIDs: ColumnID[];

    updateAxisData: (graphAxis: GraphAxisType, index: number, columnID?: ColumnID) => void;
    mitoAPI: MitoAPI;
}): JSX.Element => {

    /* 
        Save the cta for each of the possible subtexts. We save a subtext for each one 
        so that changing one cta does not change all of them. 
    */
    const [disableDueToSingleAxisGraphCTA, setDisableDueToSingleAxisGraphCTA] = useState<string | undefined>(undefined)
    const [disabledDueToKeySeriesRequirementCTA, setDisabledDueToKeySeriesCTARequirementCTA] = useState<string | undefined>(undefined)
    const [disabledDueToMaxSeriesReachedCTA, setDisabledDueToMaxSeriesReachedCTA] = useState<string | undefined>(undefined)

    useEffect(() => {
        if (disableDueToSingleAxisGraphCTA !== undefined) {
            logCtaClick('Single Axis Graph')
        }
    }, [disableDueToSingleAxisGraphCTA])

    useEffect(() => {
        if (disabledDueToKeySeriesRequirementCTA !== undefined) {
            logCtaClick('Key Series Required')
        }
    }, [disabledDueToKeySeriesRequirementCTA])

    useEffect(() => {
        if (disabledDueToMaxSeriesReachedCTA !== undefined) {
            logCtaClick('Max Series Reached')
        }
    }, [disabledDueToMaxSeriesReachedCTA])

    const logCtaClick = (ctaClicked: string) => {
        const x_axis_column_ids = props.graphAxis === GraphAxisType.X_AXIS ? props.selectedColumnIDs : props.otherAxisSelectedColumnIDs
        const y_axis_column_ids = props.graphAxis === GraphAxisType.Y_AXIS ? props.selectedColumnIDs : props.otherAxisSelectedColumnIDs

        void props.mitoAPI.sendLogMessage('graph_cta_clicked', {
            'graph_type': props.graphType,
            'axis': props.graphAxis,
            'x_axis_column_ids': x_axis_column_ids,
            'y_axis_column_ids': y_axis_column_ids,
            'cta_clicked': ctaClicked
        });
    }

    // Filter the column headers that the user can select to only the columns that are the correct type for the graph
    let selectableColumnIDs: ColumnID[] = []
    if (props.graphType === GraphType.BOX || props.graphType === GraphType.HISTOGRAM) {
        selectableColumnIDs = Object.keys(props.columnIDsMap).filter(columnID => {
            return isNumberDtype(props.columnDtypesMap[columnID])
        })
    } else {
        // If the graph is not a Box plot of Histogram, then any column can be selected.
        selectableColumnIDs = Object.keys(props.columnIDsMap);
    }

    // Create Large Selects and delete buttons for each of the columns that have already been selected
    const selectedColumnHeaderSelects = props.selectedColumnIDs.map((columnID, i) => {
        return ((
            <Row key={columnID} justify='space-between' align='center'>
                <Col flex='1'>
                    <Select
                        value={columnID}
                        onChange={(columnID: string) => {
                            props.updateAxisData(
                                props.graphAxis,
                                i,
                                columnID
                            )
                        }}
                        searchable
                    >
                        {selectableColumnIDs.map(columnID => {
                            const columnHeader = props.columnIDsMap[columnID];
                            return (
                                <DropdownItem
                                    key={columnID}
                                    id={columnID}
                                    title={getDisplayColumnHeader(columnHeader)}
                                />
                            )
                        })}
                    </Select>
                </Col>
                <Col offset={1} offsetRight={1}>
                    <XIcon
                        onClick={() => { props.updateAxisData(props.graphAxis, i) }}
                    />
                </Col>
            </Row>
        ))
    })

    // Calculate if the axis should be disabled for any of the following three reasons. 
    const numSelectedColumns = props.selectedColumnIDs.length
    const numOtherAxisSelectedColumns = props.otherAxisSelectedColumnIDs.length

    /* 
        1. If the graph type selected only supports one axis, and the other axis already has a series, 
        then don't let the user add a series to this axis
    */
    const disableDueToSingleAxisGraphBool =
        (props.graphType === GraphType.BOX || props.graphType === GraphType.HISTOGRAM) &&
        numOtherAxisSelectedColumns > 0

    /* 
        2. If the axis only has 1 series, but the other axis has more than 1 series, then you can't add more series
        to this axis because we don't let users stack on both columns. 
    */
    const disabledDueToKeySeriesRequirementBool = numSelectedColumns === 1 && numOtherAxisSelectedColumns > 1

    /* 3. If there are already four series being graphed, then don't let the user add another series */
    const disabledDueToMaxSeriesReachedBool = numSelectedColumns + numOtherAxisSelectedColumns >= 4

    return (
        <div className='axis-section-container'>
            <Row justify='space-between' align='center'>
                <Col>
                    <div className='text-header-3'>
                        {props.graphAxis}
                    </div>
                </Col>
                <Col>
                    <DropdownButton
                        text='+ Add'
                        width='small'
                        disabled={disableDueToSingleAxisGraphBool || disabledDueToKeySeriesRequirementBool || disabledDueToMaxSeriesReachedBool}
                        searchable
                    >
                        {selectableColumnIDs.map(columnID => {
                            const columnHeader = props.columnIDsMap[columnID];
                            return (
                                <DropdownItem
                                    key={columnID}
                                    title={getDisplayColumnHeader(columnHeader)}
                                    onClick={() => {
                                        props.updateAxisData(
                                            props.graphAxis,
                                            props.selectedColumnIDs.length,
                                            columnID
                                        )
                                    }}
                                />
                            )
                        })}
                    </DropdownButton>
                </Col>
            </Row>
            {/* At most one of the three subtext messages are displayed */}
            {disableDueToSingleAxisGraphBool &&
                <div className='text-subtext-1 text-align-left'>
                    {props.graphType}s only support one axis.&nbsp;
                    {disableDueToSingleAxisGraphCTA === undefined ?
                        <a className='axis-section-cta' onClick={() => {
                            setDisableDueToSingleAxisGraphCTA("Thanks! Coming Soon. ")
                        }}>
                            Want to use both axises?
                        </a> :
                        <>{disableDueToSingleAxisGraphCTA}</>
                    }
                </div>
            }
            {!disableDueToSingleAxisGraphBool && disabledDueToKeySeriesRequirementBool &&
                <div className='text-subtext-1 text-align-left'>
                    You can only have multiple series on one axis at a time.&nbsp;
                    {disabledDueToKeySeriesRequirementCTA === undefined ?
                        <a className='axis-section-cta' onClick={() => {
                            setDisabledDueToKeySeriesCTARequirementCTA("Thanks! Coming Soon. ")
                        }}>
                            Want to stack both axises?
                        </a> :
                        <>{disabledDueToKeySeriesRequirementCTA}</>
                    }
                </div>
            }
            {!disableDueToSingleAxisGraphBool && !disabledDueToKeySeriesRequirementBool && disabledDueToMaxSeriesReachedBool &&
                <div className='text-subtext-1 text-align-left'>
                    You can only graph four series at once.&nbsp;
                    {disabledDueToMaxSeriesReachedCTA === undefined ?
                        <a className='axis-section-cta' onClick={() => {
                            setDisabledDueToMaxSeriesReachedCTA("Thanks! Coming Soon. ")
                        }}>
                            Want more?
                        </a> :
                        <>{disabledDueToMaxSeriesReachedCTA}</>
                    }
                </div>
            }
            {selectedColumnHeaderSelects}
        </div>
    )
};

export default AxisSection;
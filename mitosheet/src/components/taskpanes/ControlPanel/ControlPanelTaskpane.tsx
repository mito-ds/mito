// Copyright (c) Mito

import React from 'react';
import "../../../../css/taskpanes/ControlPanel/ControlPanelTaskpane.css";
import MitoAPI from '../../../jupyter/api';
import { ColumnIDsMap, MitoSelection, SheetData, StepType, UIState, EditorState, GridState, AnalysisData } from '../../../types';
import { getCellDataFromCellIndexes } from '../../endo/utils';
import { TaskpaneType } from '../taskpanes';
import ControlPanelTaskpaneTabs from './ControlPanelTaskpaneTabs';
import DtypeCard from './SortDtypeTab/DtypeCard';
import FilterCard from './FilterTab/filter/FilterCard';
import SortCard from './SortDtypeTab/SortCard';
import ColumnSummaryGraph from './SummaryStatsTab/ColumnSummaryGraph';
import ColumnSummaryStatistics from './SummaryStatsTab/ColumnSummaryStatistics';
import { UniqueValuesCard } from './FilterTab/UniqueValuesCard';
import FormatCard from './SortDtypeTab/FormatCard';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneFooter from '../DefaultTaskpane/DefaultTaskpaneFooter';
import Spacer from '../../spacing/Spacer';
import Row from '../../spacing/Row';

/* 
    We wait 500ms before sending a filter message to make sure
    that as the user is typing key changes, we don't queue up a
    ton of filtering messages.
*/

export enum ControlPanelTab {
    SortDtype = 'sort_dtype',
    Filter = 'filter',
    SummaryStats = 'summary_stats'
}


type ControlPanelTaskpaneProps = {
    selectedSheetIndex: number,
    selection: MitoSelection,
    sheetData: SheetData | undefined,
    columnIDsMapArray: ColumnIDsMap[],
    mitoContainerRef: React.RefObject<HTMLDivElement>,
    gridState: GridState,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    mitoAPI: MitoAPI,
    tab: ControlPanelTab,
    lastStepIndex: number,
    lastStepType: StepType,
    analysisData: AnalysisData;
}


export const ControlPanelTaskpane = (props: ControlPanelTaskpaneProps): JSX.Element => {
    
    // Get the values for the first cell that was selected, in accordance with our standard
    const {columnHeader, columnID, columnFilters, columnDtype, columnFormatType} = getCellDataFromCellIndexes(props.sheetData, props.selection.startingRowIndex, props.selection.startingColumnIndex);

    if (props.sheetData === undefined || columnHeader === undefined || columnID === undefined || columnDtype == undefined || columnFormatType == undefined || columnFilters === undefined) {
        props.setUIState((prevUIState) => {
            return {
                ...prevUIState,
                currOpenTaskpane: {type: TaskpaneType.NONE}
            }
        })
        return <></>;
    }


    return (
        <React.Fragment>
            <DefaultTaskpane>
                <DefaultTaskpaneHeader
                    header={getDisplayColumnHeader(columnHeader)}
                    setUIState={props.setUIState}
                />
                <DefaultTaskpaneBody>
                    {props.tab === ControlPanelTab.SortDtype &&
                        <>
                            <DtypeCard
                                selectedSheetIndex={props.selectedSheetIndex}
                                columnID={columnID}
                                columnDtype={columnDtype}
                                mitoAPI={props.mitoAPI}
                                lastStepIndex={props.lastStepIndex}
                                lastStepType={props.lastStepType}
                            />
                            <FormatCard 
                                columnID={columnID}
                                mitoAPI={props.mitoAPI}
                                gridState={props.gridState}
                                columnDtype={columnDtype}
                                sheetData={props.sheetData}
                            />
                            <SortCard
                                selectedSheetIndex={props.selectedSheetIndex}
                                columnID={columnID} 
                                mitoAPI={props.mitoAPI}
                                analysisData={props.analysisData}
                            />
                            <Spacer px={15}/>
                            <Row justify='start'>
                                <p className='text-body-2 text-color-medium-gray-important'>
                                    Looking to filter? Check the Filter tab below.
                                </p>

                            </Row>
                        </>
                    }
                    {props.tab === ControlPanelTab.Filter && 
                        <>
                            <FilterCard
                                selectedSheetIndex={props.selectedSheetIndex}
                                columnID={columnID}
                                columnFilters={columnFilters}
                                columnDtype={columnDtype}
                                mitoAPI={props.mitoAPI}
                                sheetData={props.sheetData}
                                analysisData={props.analysisData}
                            />
                            <Spacer px={15}/>
                            <UniqueValuesCard
                                selectedSheetIndex={props.selectedSheetIndex}
                                columnID={columnID}
                                mitoAPI={props.mitoAPI}
                                columnDtype={columnDtype}
                                columnFormatType={columnFormatType}
                                setUIState={props.setUIState}
                            />
                        </>
                    }
                    {props.tab === ControlPanelTab.SummaryStats &&
                        <>
                            <ColumnSummaryGraph
                                selectedSheetIndex={props.selectedSheetIndex}
                                columnID={columnID}
                                mitoAPI={props.mitoAPI}
                            />
                            <ColumnSummaryStatistics
                                selectedSheetIndex={props.selectedSheetIndex}
                                columnID={columnID}
                                mitoAPI={props.mitoAPI}
                                columnDtype={columnDtype}
                                columnFormatType={columnFormatType}
                                setUIState={props.setUIState}
                            />
                        </>
                    }
                </DefaultTaskpaneBody>
                <DefaultTaskpaneFooter ignoreTaskpanePadding>
                    <ControlPanelTaskpaneTabs
                        selectedTab={props.tab}
                        setUIState={props.setUIState}
                        mitoAPI={props.mitoAPI}
                    />
                </DefaultTaskpaneFooter>
            </DefaultTaskpane>
        </React.Fragment>
    );
}
 
export default ControlPanelTaskpane;
/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React, { useCallback, useState } from 'react';
import "../../../../../css/taskpanes/ControlPanel/ControlPanelTaskpane.css";
import { MitoAPI, getRandomId } from '../../../api/api';
import { useDebouncedEffect } from '../../../hooks/useDebouncedEffect';
import { useEffectOnUpdateEvent } from '../../../hooks/useEffectOnUpdateEvent';
import { AnalysisData, EditorState, FilterGroupType, FilterType, GridState, MitoSelection, Operator, SheetData, StepType, UIState } from '../../../types';
import { getDisplayColumnHeader } from '../../../utils/columnHeaders';
import { getCellDataFromCellIndexes } from '../../endo/utils';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';
import DefaultTaskpaneFooter from '../DefaultTaskpane/DefaultTaskpaneFooter';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import { TaskpaneType } from '../taskpanes';
import ControlPanelTaskpaneTabs from './ControlPanelTaskpaneTabs';
import DtypeCard from './FilterAndSortTab/DtypeCard';
import FormatCard from './FilterAndSortTab/FormatCard';
import SortCard from './FilterAndSortTab/SortCard';
import FilterCard from './FilterAndSortTab/filter/FilterCard';
import { getFiltersToApply } from './FilterAndSortTab/filter/filterUtils';
import ColumnSummaryGraph from './SummaryStatsTab/ColumnSummaryGraph';
import ColumnSummaryStatistics from './SummaryStatsTab/ColumnSummaryStatistics';
import { ValuesTab } from './ValuesTab/ValuesTab';

/* 
    We wait 500ms before sending a filter message to make sure
    that as the user is typing key changes, we don't queue up a
    ton of filtering messages.
*/
const FILTER_MESSAGE_DELAY = 500;

export enum ControlPanelTab {
    FilterSort = 'filter_sort',
    UniqueValues = 'unique_values',
    SummaryStats = 'summary_stats'
}


type ControlPanelTaskpaneProps = {
    selectedSheetIndex: number,
    selection: MitoSelection,
    sheetData: SheetData | undefined,
    mitoContainerRef: React.RefObject<HTMLDivElement>,
    gridState: GridState,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    setEditorState: React.Dispatch<React.SetStateAction<EditorState | undefined>>;
    mitoAPI: MitoAPI,
    tab: ControlPanelTab,
    lastStepIndex: number,
    lastStepType: StepType,
    analysisData: AnalysisData;
    closeOpenEditingPopups: () => void;
}


export const ControlPanelTaskpane = (props: ControlPanelTaskpaneProps): JSX.Element => {
    
    // Get the values for the first cell that was selected, in accordance with our standard
    const {columnHeader, columnID, columnFilters, columnDtype, columnFormat} = getCellDataFromCellIndexes(props.sheetData, props.selection.startingRowIndex, props.selection.startingColumnIndex);

    const [filters, _setFilters] = useState(columnFilters !== undefined ? columnFilters.filters : []);
    const [operator, _setOperator] = useState(columnFilters !== undefined ? columnFilters.operator : 'And');
    const [updateNumber, setUpdateNumber] = useState(0);
    const [stepID] = useState(() => getRandomId());

    // We wrap the _setFilters call we use internally, so that on undo
    // and redo we can call the internal one, but all other calls will 
    // automatically trigger a message to be sent
    const setFilters: React.Dispatch<React.SetStateAction<(FilterType | FilterGroupType)[]>> = useCallback(
        (args: any) => {
            _setFilters(args);
            setUpdateNumber(old => old + 1)
        },
        [],
    );

    const setOperator: React.Dispatch<React.SetStateAction<Operator>> = useCallback(
        (args: any) => {
            _setOperator(args);
            setUpdateNumber(old => old + 1)
        },
        [],
    );

    const [originalNumRows, ] = useState(props.sheetData?.numRows || 0)
    const [editedFilter, setEditedFilter] = useState(false)

    // When the filters or operator changes, send a new message, as long as this is not
    // the first time that this rendered. We use a ref to avoid sending a message the first 
    // time it renders
    useDebouncedEffect(() => {
        if (updateNumber != 0) {
            void _sendFilterUpdateMessage();
        }
    }, [updateNumber], FILTER_MESSAGE_DELAY)

    // Make sure to refresh the filters when they run
    useEffectOnUpdateEvent(() => {
        _setFilters(prevFilters => {return columnFilters?.filters || prevFilters})
    }, props.analysisData)
    
    // If this is not a valid column, don't render anything, and close the takspane! 
    // We have to do this after the useState calls, to make sure this is valid react
    if (columnHeader === undefined || columnID === undefined || columnDtype == undefined) {
        props.setUIState((prevUIState) => {
            return {
                ...prevUIState,
                currOpenTaskpane: {type: TaskpaneType.NONE}
            }
        })
        return <></>
    }

    /* 
        NOTE: only call this through the sendFilterUpdateMessage function, to make sure
        buffering messages works properly.

        Before sending the displayed filters, we parse all the number filters from strings
        to numbers, and then filter out all of the invalid filters (as to not cause errors)
    */
    const _sendFilterUpdateMessage = async(): Promise<void> => {

        // To handle decimals, we allow decimals to be submitted, and then just
        // parse them before they are sent to the back-end
        const filtersToApply = getFiltersToApply(filters, columnDtype)

        // If we're applying 0 filters, and we currently have 0 filters, then
        // we aren't actually doing anything, so we don't need to send a message
        // This is necessary so we don't update the onboarding checklist to say
        // a filter is done when it is not
        if (filtersToApply.length === 0 && (columnFilters !== undefined && columnFilters.filters.length === 0)) {
            return;
        } 
        
        await props.mitoAPI.editFilter(
            props.selectedSheetIndex,
            columnID,
            filtersToApply,
            operator,
            props.tab,
            stepID
        )

        setEditedFilter(true) 
    }

    return (
        <React.Fragment>
            <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
                <DefaultTaskpaneHeader
                    header={getDisplayColumnHeader(columnHeader)}
                    setUIState={props.setUIState}
                />
                <DefaultTaskpaneBody>
                    {props.tab === ControlPanelTab.FilterSort &&
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
                                closeOpenEditingPopups={props.closeOpenEditingPopups}
                            />
                            <SortCard
                                selectedSheetIndex={props.selectedSheetIndex}
                                columnID={columnID} 
                                mitoAPI={props.mitoAPI}
                                analysisData={props.analysisData}
                            />
                            <FilterCard
                                selectedSheetIndex={props.selectedSheetIndex}
                                columnID={columnID}
                                filters={filters}
                                setFilters={setFilters}
                                setOperator={setOperator}
                                columnDtype={columnDtype}
                                operator={operator}
                                mitoAPI={props.mitoAPI}
                                rowDifference={originalNumRows - (props.sheetData?.numRows || 0)}
                                editedFilter={editedFilter}
                            />
                        </>
                    }
                    {props.tab === ControlPanelTab.UniqueValues && 
                        <>
                            <ValuesTab
                                selectedSheetIndex={props.selectedSheetIndex}
                                columnID={columnID}
                                filters={filters}
                                setFilters={setFilters}
                                mitoAPI={props.mitoAPI}
                                columnDtype={columnDtype}
                                columnFormat={columnFormat}
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
                                columnFormat={columnFormat}
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
// Copyright (c) Mito

import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';

/* 
    Import CSS that we use globally, list these in alphabetical order
    to make it easier to confirm we have imported all sitewide css.

    Except we put the colors.css first because it creates variables used elsewhere. 
*/
import '../../css/sitewide/colors.css';
import '../../css/sitewide/all-modals.css';
import '../../css/sitewide/animations.css';
import '../../css/sitewide/borders.css'
import '../../css/sitewide/element-sizes.css';
import '../../css/sitewide/flexbox.css';
import '../../css/sitewide/fonts.css';
import '../../css/sitewide/height.css';
import '../../css/sitewide/margins.css';
import '../../css/sitewide/paddings.css';
import '../../css/sitewide/text.css';
import '../../css/sitewide/widths.css';
import '../../css/sitewide/icons.css';

// Import sheet and code components
import Footer from './footer/Footer';
import Toolbar from './toolbar/Toolbar';
import LoadingIndicator from './LoadingIndicator';

import ErrorModal from './modals/ErrorModal';
import MitoAPI from '../api';
import PivotTaskpane from './taskpanes/PivotTable/PivotTaskpane';
import { EDITING_TASKPANES, TaskpaneType } from './taskpanes/taskpanes';
import MergeTaskpane from './taskpanes/Merge/MergeTaskpane';
import ControlPanelTaskpane, { ControlPanelTab } from './taskpanes/ControlPanel/ControlPanelTaskpane';
import SignUpModal from './modals/SignupModal';
import UpgradeModal from './modals/UpgradeModal';
import StepsTaskpane from './taskpanes/Steps/StepsTaskpane';
import CatchUpPopup from './CatchUpPopup';
import ImportTaskpane from './taskpanes/Import/ImportTaskpane';
import Tour from './tour/Tour';
import { TourName } from './tour/Tours';
import GraphSidebar from './taskpanes/Graph/GraphSidebar';
import DownloadTaskpane from './taskpanes/Download/DownloadTaskpane';
import ClearAnalysisModal from './modals/ClearAnalysisModal';
import { ModalEnum } from './modals/modals';
import { AnalysisData, EditorState, DataTypeInMito, DFSource, GridState, UIState, UserProfile } from '../types';
import { getDefaultGridState, getCellDataFromCellIndexes } from './endo/utils';
import EndoGrid from './endo/EndoGrid';
import { SheetData } from '../types';
import { classNames } from '../utils/classNames';
import { focusGrid } from './endo/focusUtils';
import DropDuplicatesTaskpane from './taskpanes/DropDuplicates/DropDuplicates';
import { createActions } from '../utils/actions';
import SearchTaskpane from './taskpanes/Search/SearchTaskpane';
import loadPlotly from '../utils/plotly';
import ErrorBoundary from './elements/ErrorBoundary';
import DeleteGraphsModal from './modals/DeleteGraphsModal';
import { selectPreviousGraphSheetTab } from './footer/SheetTab';
import ConcatTaskpane from './taskpanes/Concat/ConcatTaskpane';

export type MitoProps = {
    model_id: string;
    mitoAPI: MitoAPI;

    /*
        NOTE: in the future, we should rename this to just a metadata array to clarify
        that this does not actually have any of the column or index data. That is all
        handled by lazy loading in EndoGrid.tsx 
    */
    sheetDataArray: SheetData[];
    analysisData: AnalysisData;
    userProfile: UserProfile;
};


export const Mito = (props: MitoProps): JSX.Element => {

    const mitoContainerRef = useRef<HTMLDivElement>(null);

    const [sheetDataArray, setSheetDataArray] = useState<SheetData[]>(props.sheetDataArray);
    const [analysisData, setAnalysisData] = useState<AnalysisData>(props.analysisData);
    const [userProfile, setUserProfile] = useState<UserProfile>(props.userProfile);

    // TODO: can we delete the above 3 props keys, so we cannot use them (as type checked by compiler)?
    // These props are always out of date, and we should only use the state variables.

    const [gridState, setGridState] = useState<GridState>(() => getDefaultGridState(sheetDataArray, 0))
    // Set reasonable default values for the UI state
    const [uiState, setUIState] = useState<UIState>({
        loading: 0,
        currOpenModal: props.userProfile.userEmail == '' && props.userProfile.telemetryEnabled // no signup if no logs
            ? {type: ModalEnum.SignUp} 
            : (props.userProfile.shouldUpgradeMitosheet 
                ? {type: ModalEnum.Upgrade} : {type: ModalEnum.None}
            ),
        currOpenTaskpane: {type: TaskpaneType.NONE},
        selectedColumnControlPanelTab: ControlPanelTab.FilterSort,
        selectedSheetIndex: 0,
        selectedGraphID: Object.keys(props.analysisData.graphDataDict || {}).length === 0 ? undefined : Object.keys(props.analysisData.graphDataDict)[0],
        selectedTabType: 'data',
        displayFormatToolbarDropdown: false,
        exportConfiguration: {exportType: 'csv'}
    })
    const [editorState, setEditorState] = useState<EditorState | undefined>(undefined);

    const [highlightPivotTableButton, setHighlightPivotTableButton] = useState(false);
    const [highlightAddColButton, setHighlightAddColButton] = useState(false);

    // We store the path that the user last uses when they are using the import
    // in Mito so that we can open to the same place next time they use it
    const [currPathParts, setCurrPathParts] = useState<string[]>(['.']);


    /**
     * Save the state updaters in the window, so they are accessible
     * from outside the component, so the API can update them when it
     * gets a message
     * 
     * Then, also read in the arguments below the mitosheet, as well as
     * the analysis below the mitosheet, and send them to the backend. We
     * do this here so we can be sure it's after the state updaters have
     * been defined.
     */
    useEffect(() => {
        if (window.setMitoStateMap === undefined) {
            window.setMitoStateMap = new Map();
        }

        if (window.setMitoStateMap) {
            window.setMitoStateMap.set(props.model_id, {
                setSheetDataArray: setSheetDataArray,
                setAnalysisData: setAnalysisData,
                setUserProfile: setUserProfile,
                setUIState: setUIState,
            });
        }

        if (!window.commands) {
            // If the window commands are not defined, we throw an error
            // message so that we know this is happening
            void props.mitoAPI.log('window_commands_not_defined_failed')
        } else if (!window.commands.hasCommand('get-args')) {
            // Also check the case where our commands are not yet defined,
            // as this may also be happening as a race condition
            void props.mitoAPI.log('window_commands_get_args_not_defined_failed')
        }

        // Get the arguments passed to the mitosheet.sheet call
        window.commands?.execute('get-args').then(async (args: string[]) => {
            await props.mitoAPI.updateArgs(args);
        });

        // Get any previous analysis and send it back to the model!
        window.commands?.execute('read-existing-analysis').then(async (analysisName: string | undefined) => {
            // If there is no previous analysis, we just ignore this step
            if (!analysisName) return;

            // We send it to the backend
            await props.mitoAPI.updateReplayAnalysis(
                analysisName,
                undefined,
                /* 
                    When we read in an analysis name from a cell, we replay this analysis
                    while also overwriting _everything_ that is already in the analysis. 

                    This is to avoid issues w/ passing in a saved analysis to the mitosheet.sheet
                    call, where then rerunning the cell with this call w/ doubly-apply things.
                */
                true
            )
        });

        // We log that the mitosheet has rendered explicitly, so that we can
        // tell if an installation is broken
        void props.mitoAPI.log('mitosheet_rendered');

        return () => {
            if (window.setMitoStateMap) {
                window.setMitoStateMap.delete(props.model_id);
            }
        }

        
    }, [])

    // Load plotly, so we can generate graphs
    useEffect(() => {
        loadPlotly()
    }, [])

    /* 
        When the number of sheets increases, we make sure
        that the last sheet is highlighted. If it decreases,
        we make sure it is not out of bounds.

        We use a ref to store the previous number to avoid
        triggering unnecessary rerenders.
    */
    const previousNumSheetsRef = useRef<number>(sheetDataArray.length);
    useEffect(() => {
        const previousNumSheets = previousNumSheetsRef.current;

        // Make sure that the selectedSheetIndex is always >= 0 so we can index into the 
        // widthDataArray without erroring
        setUIState(prevUIState => {

            const prevSelectedSheetIndex = prevUIState.selectedSheetIndex;
            let newSheetIndex = prevSelectedSheetIndex;

            if (previousNumSheets < sheetDataArray.length) {
                newSheetIndex = sheetDataArray.length - 1 >= 0 ? sheetDataArray.length - 1 : 0;
            } else if (prevSelectedSheetIndex >= sheetDataArray.length) {
                newSheetIndex = sheetDataArray.length - 1 >= 0 ? sheetDataArray.length - 1 : 0;
            }
            
            return {
                ...prevUIState,
                selectedSheetIndex: newSheetIndex,
            };
        })

        previousNumSheetsRef.current = sheetDataArray.length;
    }, [sheetDataArray])

    const previousNumGraphsRef = useRef<number>(Object.keys(analysisData.graphDataDict || {}).length)
    const previousGraphIndex = useRef<number>(uiState.selectedGraphID !== undefined ?
        Object.keys(analysisData.graphDataDict  || {}).indexOf(uiState.selectedGraphID) : -1)

    // When we switch graphID's make sure that we keep the previousGraphIndex up to date
    useEffect(() => {
        previousGraphIndex.current = uiState.selectedGraphID !== undefined ?
            Object.keys(analysisData.graphDataDict || {}).indexOf(uiState.selectedGraphID) : -1
    }, [uiState.selectedGraphID])

    // Update the selected sheet tab when the number of graphs change. 
    useEffect(() => {
        const graphIDs = Object.keys(analysisData.graphDataDict || {})
        const previousNumGraphs = previousNumGraphsRef.current;
        const newNumGraphs = Object.keys(analysisData.graphDataDict || {}).length

        // Handle new graph created
        if (previousNumGraphs < newNumGraphs) {
            const newGraphID = graphIDs[newNumGraphs - 1]
            setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    selectedGraphID: newGraphID,
                    selectedTabType: 'graph',
                    currOpenTaskpane: {
                        type: TaskpaneType.GRAPH,
                        graphID: newGraphID,
                    },
                }
            })

            // Update the previous graph index for next time
            previousGraphIndex.current = graphIDs.indexOf(newGraphID)

        // Handle graph removal
        } else if (previousNumGraphs > newNumGraphs) {
            // Try to go to the same sheet index, if it doesn't exist go to the graph index - 1, 
            // if no graphs exists, go to the last sheet index
            const newGraphID = selectPreviousGraphSheetTab(analysisData.graphDataDict, previousGraphIndex.current, setUIState)

            // Update the previous graph index for next time
            previousGraphIndex.current = newGraphID !== undefined ? graphIDs.indexOf(newGraphID) : -1
        }

        previousNumGraphsRef.current = newNumGraphs
    }, [Object.keys(analysisData.graphDataDict || {}).length])


    /*
        Code to be executed everytime the sheet is switched. 
        1. if the sheet that is switched to is a pivot sheet, we start editing this pivot table
        2. if the cell editor is open, close it.
    */
    useEffect(() => {
        const openEditedPivot = async (): Promise<void> => {
            const existingPivotParams = await props.mitoAPI.getPivotParams(uiState.selectedSheetIndex);
            if (existingPivotParams !== undefined) {
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {
                            type: TaskpaneType.PIVOT,
                            destinationSheetIndex: uiState.selectedSheetIndex,
                            existingPivotParams: existingPivotParams
                        },
                        selectedTabType: 'data'
                    }
                })
            }
        }

        const source = dfSources[uiState.selectedSheetIndex];
        // Open the pivot if it's a pivot, and there's no other taskpane open
        if (source !== undefined && source === DFSource.Pivoted && uiState.currOpenTaskpane.type === TaskpaneType.NONE) {
            void openEditedPivot()
        }

        // Close the cell editor if it is open
        if (editorState !== undefined) {
            setEditorState(undefined)
        }

    }, [uiState.selectedSheetIndex])

    // Store the prev open taskpane in a ref, to avoid triggering rerenders
    const prevOpenTaskpaneRef = useRef(uiState.currOpenTaskpane.type);
    useEffect(() => {
        // If a taskpane is closed, but was previously open, then we 
        // focus on the grid, ready to accept user input
        if (prevOpenTaskpaneRef.current !== TaskpaneType.NONE && uiState.currOpenTaskpane.type === TaskpaneType.NONE) {
            const endoGridContainer = mitoContainerRef.current?.querySelector('.endo-grid-container') as HTMLDivElement | null | undefined;
            focusGrid(endoGridContainer);
        }

        prevOpenTaskpaneRef.current = uiState.currOpenTaskpane.type;

    }, [uiState])


    const dfNames = sheetDataArray.map(sheetData => sheetData.dfName);
    const dfSources = sheetDataArray.map(sheetData => sheetData.dfSource);
    const columnIDsMapArray = sheetDataArray.map(sheetData => sheetData.columnIDsMap);

    const lastStepSummary = analysisData.stepSummaryList[analysisData.stepSummaryList.length - 1];

    // Get the column id of the currently selected column
    const {columnID} = getCellDataFromCellIndexes(
        sheetDataArray[uiState.selectedSheetIndex], 
        gridState.selections[gridState.selections.length - 1].endingRowIndex, 
        gridState.selections[gridState.selections.length - 1].endingColumnIndex
    );

    /* 
        Closes any open editing popups, which includes:
        1. Any open sheet tab actions
        2. The taskpane, if it is an EDITING_TASKPANE
        3. All Modals

        Allows you to optionally specify a list of taskpanes to keep open if they
        are currently open, which is useful for undo, for example,
        when editing a pivot table and pressing undo
    */ 
    const closeOpenEditingPopups = useCallback((taskpanesToKeepIfOpen?: TaskpaneType[]) => {
        // Close the taskpane if it is an editing taskpane, and it is not in the list of taskpanesToKeepIfOpen
        if (EDITING_TASKPANES.includes(uiState.currOpenTaskpane.type) && (taskpanesToKeepIfOpen === undefined || !taskpanesToKeepIfOpen.includes(uiState.currOpenTaskpane.type))) {
            setUIState((prevUIState) => {
                return {
                    ...prevUIState,
                    currOpenTaskpane: {
                        type: TaskpaneType.NONE
                    },
                    currOpenModal: {
                        type: ModalEnum.None
                    },
                    selectedTabType: 'data'
                }
            });
        }
    }, [uiState]);

    const getCurrentModalComponent = (): JSX.Element => {
        // Returns the JSX.element that is currently, open, and is used
        // in render to display this modal

        switch(uiState.currOpenModal.type) {
            case ModalEnum.None: return <div></div>;
            case ModalEnum.Error: return (
                <ErrorModal
                    error={uiState.currOpenModal.error}
                    setUIState={setUIState}
                    mitoAPI={props.mitoAPI}
                />
            )
            case ModalEnum.ClearAnalysis: return (
                <ClearAnalysisModal
                    setUIState={setUIState}
                    mitoAPI={props.mitoAPI}
                />
            )
            case ModalEnum.SignUp: return (
                <SignUpModal
                    setUIState={setUIState}
                    numUsages={userProfile.numUsages}
                    mitoAPI={props.mitoAPI}
                    isPro={userProfile.isPro}
                />
            )
            case ModalEnum.Upgrade: return (
                <UpgradeModal
                    setUIState={setUIState}
                    mitoAPI={props.mitoAPI}
                />
            )
            case ModalEnum.DeleteGraphs: return (
                <DeleteGraphsModal
                    setUIState={setUIState}
                    mitoAPI={props.mitoAPI}
                    sheetIndex={uiState.currOpenModal.sheetIndex}
                    dependantGraphTabNamesAndIDs={uiState.currOpenModal.dependantGraphTabNamesAndIDs}
                    dfName={sheetDataArray[uiState.currOpenModal.sheetIndex] ? sheetDataArray[uiState.currOpenModal.sheetIndex].dfName : 'this dataframe'}
                />
            )
        }
    }

    const getCurrOpenTaskpane = (): JSX.Element => {

        switch(uiState.currOpenTaskpane.type) {
            case TaskpaneType.CONTROL_PANEL: 
                return (
                    <ControlPanelTaskpane 
                        // Set the columnHeader, sheet index as the key so that the taskpane updates when it is switched
                        // TODO: figure out why we need this, if the other variables update?
                        key={'' + columnID + uiState.selectedSheetIndex} 
                        selectedSheetIndex={uiState.selectedSheetIndex}
                        sheetData={sheetDataArray[uiState.selectedSheetIndex]}
                        columnIDsMapArray={columnIDsMapArray}
                        selection={gridState.selections[gridState.selections.length - 1]} 
                        gridState={gridState}
                        mitoContainerRef={mitoContainerRef}
                        setUIState={setUIState} 
                        setEditorState={setEditorState}
                        mitoAPI={props.mitoAPI}
                        tab={uiState.selectedColumnControlPanelTab}
                        lastStepIndex={lastStepSummary.step_idx}
                        lastStepType={lastStepSummary.step_type}
                    />
                )
            case TaskpaneType.DOWNLOAD: return (
                <DownloadTaskpane
                    dfNames={dfNames}
                    userProfile={userProfile}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                    uiState={uiState}
                    setUIState={setUIState}
                    mitoAPI={props.mitoAPI}
                    sheetDataArray={sheetDataArray}
                />
            )
            case TaskpaneType.DROP_DUPLICATES: return (
                <DropDuplicatesTaskpane
                    dfNames={dfNames}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                    setUIState={setUIState}
                    mitoAPI={props.mitoAPI}
                    sheetDataArray={sheetDataArray}
                />
            )
            case TaskpaneType.GRAPH:
                return (
                    <GraphSidebar 
                        graphID={uiState.currOpenTaskpane.graphID}
                        dfNames={dfNames}
                        columnIDsMapArray={columnIDsMapArray}
                        sheetDataArray={sheetDataArray}
                        mitoAPI={props.mitoAPI}
                        setUIState={setUIState} 
                        uiState={uiState}
                        graphDataDict={analysisData.graphDataDict}
                        analysisData={analysisData}
                        mitoContainerRef={mitoContainerRef}
                        userProfile={userProfile}
                    />
                )
            case TaskpaneType.IMPORT: return (
                <ImportTaskpane
                    setUIState={setUIState}
                    mitoAPI={props.mitoAPI}
                    currPathParts={currPathParts}
                    setCurrPathParts={setCurrPathParts}
                    userProfile={userProfile}
                />
            )
            case TaskpaneType.MERGE: return (
                <MergeTaskpane
                    dfNames={dfNames}
                    columnIDsMapArray={columnIDsMapArray}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={props.mitoAPI}
                />
            )
            case TaskpaneType.CONCAT: return (
                <ConcatTaskpane
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={props.mitoAPI}
                />
            )
            case TaskpaneType.NONE: return (
                <Fragment/>
            )
            case TaskpaneType.PIVOT: return (
                <PivotTaskpane
                    dfNames={dfNames}
                    sheetDataArray={sheetDataArray}
                    columnIDsMapArray={columnIDsMapArray}
                    mitoAPI={props.mitoAPI}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                    analysisData={analysisData}
                    setUIState={setUIState}
                    destinationSheetIndex={uiState.currOpenTaskpane.destinationSheetIndex}
                    existingPivotParams={uiState.currOpenTaskpane.existingPivotParams}
                />
            )
            case TaskpaneType.SEARCH: return (
                <SearchTaskpane
                    mitoAPI={props.mitoAPI}
                    sheetData={sheetDataArray[gridState.sheetIndex]}
                    gridState={gridState}
                    setGridState={setGridState}
                    mitoContainerRef={mitoContainerRef}
                    uiState={uiState}
                    setUIState={setUIState}
                />
            )
            case TaskpaneType.STEPS: return (
                <StepsTaskpane
                    stepSummaryList={analysisData.stepSummaryList}
                    setUIState={setUIState}
                    mitoAPI={props.mitoAPI}
                    currStepIdx={analysisData.currStepIdx}
                />
            )
        }
    }

    /*
        Actions that the user can choose to take. We abstract them into this dictionary so they can be used
        across the codebase without replicating functionality. 
    */
    const actions = createActions(
        sheetDataArray, 
        gridState, 
        dfSources, 
        closeOpenEditingPopups, 
        setEditorState, 
        setUIState, 
        setGridState,
        props.mitoAPI, 
        mitoContainerRef
    )

    /* 
        We currrently send all users through the intro tour.

        This returns the tour JSX to display, which might be nothing
        if the user should not go through the tour for some reason.
    */
    const getCurrTour = (): JSX.Element => {

        // If the user has either no or tutorial data in the tool, don't display the tour
        if (analysisData.dataTypeInTool === DataTypeInMito.NONE || analysisData.dataTypeInTool === DataTypeInMito.TUTORIAL) {
            return <></>;
        }

        const toursToDisplay: TourName[] = []

        if (!userProfile.receivedTours.includes(TourName.INTRO)) {
            toursToDisplay.push(TourName.INTRO)
        }

        return (
            <>
                {toursToDisplay.length !== 0 && uiState.currOpenModal.type !== ModalEnum.SignUp &&
                    <Tour 
                        sheetData={sheetDataArray[uiState.selectedSheetIndex]}
                        setHighlightPivotTableButton={setHighlightPivotTableButton}
                        setHighlightAddColButton={setHighlightAddColButton}
                        tourNames={toursToDisplay}
                        mitoAPI={props.mitoAPI}
                    />
                }
            </>
        )
    }

    // Check which taskpanes are open
    const taskpaneOpen = uiState.currOpenTaskpane.type !== TaskpaneType.NONE;
    const graphTaskpaneOpen = uiState.currOpenTaskpane.type === TaskpaneType.GRAPH && uiState.selectedTabType === 'graph';
    const narrowTaskpaneOpen = taskpaneOpen && !graphTaskpaneOpen;

    /* 
        We detect whether the taskpane is open in wide mode, narrow mode, or not open at all. We then
        set the class of the div containing the Mitosheet and Formula bar, as well as the taskpane div accordingly.
        The class sets the width of the sheet. 
    */
    const formulaBarAndSheetClassNames = classNames('mito-formula-bar-and-mitosheet-div', {
        'mito-formula-bar-and-mitosheet-div-fullscreen-taskpane-open': graphTaskpaneOpen,
        'mito-formula-bar-and-mitosheet-div-narrow-taskpane-open': narrowTaskpaneOpen
    })

    const taskpaneClassNames = classNames({
        'mito-default-taskpane': !taskpaneOpen,
        'mito-default-fullscreen-taskpane-open': graphTaskpaneOpen,
        'mito-default-narrow-taskpane-open': narrowTaskpaneOpen,
    })

    return (
        <div className="mito-container" data-jp-suppress-context-menu ref={mitoContainerRef}>
            <ErrorBoundary mitoAPI={props.mitoAPI}>
                <Toolbar 
                    mitoAPI={props.mitoAPI}
                    currStepIdx={analysisData.currStepIdx}
                    lastStepIndex={lastStepSummary.step_idx}
                    highlightPivotTableButton={highlightPivotTableButton}
                    highlightAddColButton={highlightAddColButton}
                    actions={actions}
                    mitoContainerRef={mitoContainerRef}
                    gridState={gridState}
                    setGridState={setGridState}
                    uiState={uiState}
                    setUIState={setUIState}
                    sheetData={sheetDataArray[uiState.selectedSheetIndex]}
                />
                <div className="mito-main-sheet-div" id="mito-main-sheet-div"> 
                    <div className={formulaBarAndSheetClassNames}>
                        <EndoGrid
                            sheetDataArray={sheetDataArray}
                            mitoAPI={props.mitoAPI}
                            uiState={uiState}
                            setUIState={setUIState}
                            sheetIndex={uiState.selectedSheetIndex}
                            gridState={gridState}
                            setGridState={setGridState}
                            editorState={editorState}
                            setEditorState={setEditorState}
                        />
                    </div>
                    {uiState.currOpenTaskpane.type !== TaskpaneType.NONE && 
                        <div className={taskpaneClassNames}>
                            {getCurrOpenTaskpane()}
                        </div>
                    }
                </div>
                {/* Display the tour if there is one */}
                {getCurrTour()}
                <Footer
                    sheetDataArray={sheetDataArray}
                    graphDataDict={analysisData.graphDataDict}
                    gridState={gridState}
                    setGridState={setGridState}
                    mitoAPI={props.mitoAPI}
                    closeOpenEditingPopups={closeOpenEditingPopups}
                    uiState={uiState}
                    setUIState={setUIState}
                    mitoContainerRef={mitoContainerRef}
                />
                {getCurrentModalComponent()}
                {uiState.loading > 0 && <LoadingIndicator/>}      
                {/* 
                    If the step index of the last step isn't the current step,
                    then we are out of date, and we tell the user this.
                */}
                {analysisData.currStepIdx !== lastStepSummary.step_idx && 
                    <CatchUpPopup
                        fastForward={() => {
                            void props.mitoAPI.updateCheckoutStepByIndex(lastStepSummary.step_idx);
                        }}
                    />
                }
            </ErrorBoundary>
        </div>
    );
}


export default Mito;
/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito

import React, { Fragment, useCallback, useEffect, useRef, useState } from 'react';
/*
    Import CSS that we use globally, list these in alphabetical order
    to make it easier to confirm we have imported all sitewide css.

    Except we put the colors.css first because it creates variables used elsewhere.
*/
import '../../css/sitewide/all-modals.css';
import '../../css/sitewide/animations.css';
import '../../css/sitewide/borders.css';
import '../../css/sitewide/colors.css';
import '../../css/sitewide/cursor.css';
import '../../css/sitewide/element-sizes.css';
import '../../css/sitewide/flexbox.css';
import '../../css/sitewide/fonts.css';
import '../../css/sitewide/height.css';
import '../../css/sitewide/hover.css';
import '../../css/sitewide/icons.css';
import '../../css/sitewide/margins.css';
import '../../css/sitewide/paddings.css';
import '../../css/sitewide/scroll.css';
import '../../css/sitewide/text.css';
import '../../css/sitewide/widths.css';
import CatchUpPopup from './components/CatchUpPopup';
import ErrorBoundary from './components/elements/ErrorBoundary';
import EndoGrid from './components/endo/EndoGrid';
import { focusGrid } from './components/endo/focusUtils';
import { getCellDataFromCellIndexes, getDefaultGridState } from './components/endo/utils';
import Footer from './components/footer/Footer';
import ClearAnalysisModal from './components/modals/ClearAnalysisModal';
import DeleteGraphsModal from './components/modals/DeleteGraphsModal';
import ErrorModal from './components/modals/ErrorModal';
import ErrorReplayedAnalysisModal from './components/modals/ReplayAnalysisModals';
import SignUpModal from './components/modals/SignupModal';
import { ModalEnum } from './components/modals/modals';
import AITransformationTaskpane, { AITransformationParams } from './components/taskpanes/AITransformation/AITransformationTaskpane';
import CannotCreateCommTaskpane from './components/taskpanes/CannotCreateComm/CannotCreateCommTaskpane';
import CodeOptionsTaskpane from './components/taskpanes/CodeOptions/CodeOptionsTaskpane';
import CodeSnippetsTaskpane from './components/taskpanes/CodeSnippets/CodeSnippetsTaskpane';
import ColumnHeadersTransformTaskpane from './components/taskpanes/ColumnHeadersTransform/ColumnHeadersTransformTaskpane';
import ConcatTaskpane from './components/taskpanes/Concat/ConcatTaskpane';
import ControlPanelTaskpane, { ControlPanelTab } from './components/taskpanes/ControlPanel/ControlPanelTaskpane';
import DataframeImportTaskpane from './components/taskpanes/DataframeImport/DataframeImportTaskpane';
import DefaultEmptyTaskpane from './components/taskpanes/DefaultTaskpane/DefaultEmptyTaskpane';
import DownloadTaskpane from './components/taskpanes/Download/DownloadTaskpane';
import DropDuplicatesTaskpane from './components/taskpanes/DropDuplicates/DropDuplicates';
import ExcelRangeImportTaskpane from './components/taskpanes/ExcelRangeImport/ExcelRangeImportTaskpane';
import ExportToFileTaskpane from './components/taskpanes/ExportToFile/ExportToFileTaskpane';
import ImportTaskpane from './components/taskpanes/FileImport/FileImportTaskpane';
import FillNaTaskpane from './components/taskpanes/FillNa/FillNaTaskpane';
import GraphSidebar from './components/taskpanes/Graph/GraphSidebar';
import MeltTaskpane from './components/taskpanes/Melt/MeltTaskpane';
import MergeTaskpane from './components/taskpanes/Merge/MergeTaskpane';
import PivotTaskpane from './components/taskpanes/PivotTable/PivotTaskpane';
import SnowflakeImportTaskpane from './components/taskpanes/SnowflakeImport/SnowflakeImportTaskpane';
import SplitTextToColumnsTaskpane from './components/taskpanes/SplitTextToColumns/SplitTextToColumnsTaskpane';
import UpdateImportsTaskpane from './components/taskpanes/UpdateImports/UpdateImportsTaskpane';
import UserDefinedImportTaskpane from './components/taskpanes/UserDefinedImport/UserDefinedImportTaskpane';
import ConditionalFormattingTaskpane from './pro/taskpanes/ConditionalFormatting/ConditionalFormattingTaskpane';
import SetDataframeFormatTaskpane from './pro/taskpanes/SetDataframeFormat/SetDataframeFormatTaskpane';
import { AnalysisData, DFSource, EditorState, GridState, JupyterUtils, MitoSelection, PopupLocation, PopupType, SheetData, UIState, UserProfile } from './types';
import { getActions } from './utils/actions';
import { classNames } from './utils/classNames';
import loadPlotly from './utils/plotly';
import { MitoAPIResult } from './api/api';
import { SendFunction, SendFunctionError } from './api/send';
import BottomLeftPopup from './components/elements/BottomLeftPopup';
import StreamlitSignupModal from './components/modals/StreamlitSignupModal';
import UserEditedCodeModal from './components/modals/UserEditedCodeModal';
import EphemeralMessage from './components/popups/EphemeralMessage';
import DevTaskpane from './components/taskpanes/Dev/DevTaskpane';
import GithubScheduleTaskpane from './components/taskpanes/GithubSchedule/GithubScheduleTaskpane';
import StepsTaskpane from './components/taskpanes/Steps/StepsTaskpane';
import UpgradeTaskpane from './components/taskpanes/UpgradeToPro/UpgradeToProTaskpane';
import UserDefinedEditTaskpane from './components/taskpanes/UserDefinedEdit/UserDefinedEditTaskpane';
import { EDITING_TASKPANES, TASKPANE_WIDTH_MAX, TASKPANE_WIDTH_MIN, TaskpaneType, getDefaultTaskpaneWidth } from './components/taskpanes/taskpanes';
import { Toolbar } from './components/toolbar/Toolbar';
import { useMitoAPI } from './hooks/useMitoAPI';
import { getCSSStyleVariables } from './utils/colors';
import { handleKeyboardShortcuts } from './utils/keyboardShortcuts';
import { isInDashboard, isInJupyterLabOrNotebook } from './utils/location';
import { shallowEqualToDepth } from './utils/objects';

export type MitoProps = {
    getSendFunction: () => Promise<SendFunction | SendFunctionError>
    sheetDataArray: SheetData[],
    analysisData: AnalysisData,
    userProfile: UserProfile,
    jupyterUtils?: JupyterUtils,
    theme?: {
        primaryColor?: string
        backgroundColor?: string
        secondaryBackgroundColor?: string
        textColor?: string
    }
    onSelectionChange?: (selectedDataframeIndex: number, selections: MitoSelection[]) => void;
    height?: string | undefined;
};

export const Mito = (props: MitoProps): JSX.Element => {
    const mitoContainerRef = useRef<HTMLDivElement>(null);
    const [sheetDataArray, setSheetDataArray] = useState<SheetData[]>(props.sheetDataArray);
    const [analysisData, setAnalysisData] = useState<AnalysisData>(props.analysisData);
    const [userProfile, setUserProfile] = useState<UserProfile>(props.userProfile);
    const [gridState, setGridState] = useState<GridState>(() => getDefaultGridState(sheetDataArray, 0))

    // True: If the Mito spreadsheet is created by a dataframe render
    // False: If the Mitosheet is created by calling mitosheet.sheet() from a code cell
    const isDataframeRenderMitosheet = props.analysisData.inputCellExecutionCount !== null; 

    // Set reasonable default values for the UI state
    const [uiState, setUIState] = useState<UIState>({
        loading: [],
        // Don't show the signup if either:
        // 1. telemetry is turned off
        // 2. In a dashboard (streamlit or dash)
        // 3. The mitosheet is a dataframe renderer
        currOpenModal: !isDataframeRenderMitosheet &&userProfile.userEmail == '' && userProfile.telemetryEnabled && !isInDashboard()
            ? {type: ModalEnum.SignUp}   
            : {type: ModalEnum.None},
        currOpenTaskpane: {type: TaskpaneType.NONE}, 
        selectedColumnControlPanelTab: ControlPanelTab.FilterSort,
        selectedSheetIndex: 0,
        selectedTabType: 'data',
        currOpenDropdown: undefined,
        exportConfiguration: {exportType: 'csv'},
        currentToolbarTab: isDataframeRenderMitosheet? undefined : 'Home', // If dataframe render, default to collapsed toolbar tabs
        currOpenPopups: {
            [PopupLocation.TopRight]: {type: PopupType.None}
        },
        currOpenSearch: {
            isOpen: false,
            currentMatchIndex: -1,
            matches: []
        },
        dataRecon: undefined,
        taskpaneWidth: getDefaultTaskpaneWidth()
    })
    const [editorState, setEditorState] = useState<EditorState | undefined>(undefined);

    // We store the path that the user last uses when they are using the import
    // in Mito so that we can open to the same place next time they use it
    const [currPathParts, setCurrPathParts] = useState<string[]>(props.analysisData.importFolderData ? props.analysisData.importFolderData.pathParts : ['.']);

    // We store all AI Transform params in Mito, so that users can open and close
    // the AI Transform taskpane and still access their old prompts
    const [previousAITransformParams, setPreviousAITransformParams] = useState<AITransformationParams[]>([])

    // Create the Mito API
    const {mitoAPI, sendFunctionStatus} = useMitoAPI(props.getSendFunction, setSheetDataArray, setAnalysisData, setUserProfile, setUIState)
    
    // If the comm ends up failing to be created, then we open a taskpane that let's
    // the user know of this error
    useEffect(() => {
        if (sendFunctionStatus === 'no_backend_comm_registered_error' || sendFunctionStatus === 'non_valid_location_error' || sendFunctionStatus === 'non_working_extension_error') {
            setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    currOpenTaskpane: {
                        type: TaskpaneType.CANNOTCREATECOMM,
                        commCreationErrorStatus: sendFunctionStatus 
                    }
                }
            })
        }
    }, [sendFunctionStatus])

    useEffect(() => {
        // We log that the mitosheet has rendered explicitly, so that we can
        // tell if an installation is broken
        void mitoAPI.log('mitosheet_rendered');
    }, [mitoAPI])

    useEffect(() => {
        /**
         * The mitosheet is rendered first when the mitosheet.sheet() call is made,
         * but then it may be rerendered when the page the mitosheet is on is refreshed.
         * 
         * However, there are a few things we only want to do on this first render, and
         * not when the page is refreshed. We do those things in this effect, and additionally
         * track each time we rerender.
         */
        const updateMitosheetCallCellOnFirstRender = async () => {
            // Then, we go and read the arguments to the mitosheet.sheet() call. If there
            // is an analysis to replay, we use this to help lookup the call
            const args = await props.jupyterUtils?.getArgs(analysisData.analysisToReplay?.analysisName, analysisData.inputCellExecutionCount) ?? [];

            // Then, after we have the args, we replay an analysis if there is an analysis to replay
            // Note that this has to happen after so that we have the the argument names loaded in at
            // the very start of the analysis
            if (analysisData.analysisToReplay) {
                const analysisToReplayName = analysisData.analysisToReplay?.analysisName;

                // First, if the analysis to replay does not exist at all, we just open an error modal
                // and tell users that this does not exist on their computer
                if (!analysisData.analysisToReplay.existsOnDisk) {
                    void mitoAPI.log('replayed_nonexistant_analysis_failed')

                    setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenModal: {
                                type: ModalEnum.ErrorReplayedAnalysis,
                                header: 'analysis_to_replay does not exist',
                                message: `We're unable to replay ${analysisToReplayName} because you don't have access to it. This is probably because the analysis was created on a different computer.`,
                                error: undefined,
                                oldAnalysisName: analysisToReplayName,
                                newAnalysisName: analysisData.analysisName
                            }
                        }
                    })
                    return;
                }

                // Then, we replay the analysis to replay!
                const error = await mitoAPI.updateReplayAnalysis(analysisToReplayName, args);
                
                if ('error' in error) {
                    /**
                     * If an analysis fails to replay, we open the update import pre replay 
                     * taskpane with the error. The analysis either failed because an import
                     * step failed, or some other step failed as the structure of the data 
                     * changed. 
                     * 
                     * In either case, we give the user the update import pre replay taskpane
                     * so that they can hopefully resolve these issues.
                     */
                    setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {
                                type: TaskpaneType.UPDATEIMPORTS,
                                failedReplayData: {
                                    analysisName: analysisToReplayName,
                                    error: error,
                                    args: args
                                }
                            }
                        }
                    })
                }
            } else {
                /**
                 * If there is no analysis_to_replay, then we need to write the analysis_to_replay to the 
                 * mitosheet.sheet call, and update the args.
                 */
                props.jupyterUtils?.writeAnalysisToReplayToMitosheetCall(analysisData.analysisName, mitoAPI);

                await mitoAPI.updateArgs(args);
            }
        }

        const handleRenderInNotebook = async () => {
            // We need to get the render count direct from the API, and not trust the analysisData here
            // because on the first render, we might be displaying outdated data, as the anlaysis has not
            // been replayed yet. This is a function of not being a widget with constantly synced state 
            // variables
            const response = await mitoAPI.getRenderCount();
            const currentRenderCount = 'error' in response ? undefined : response.result;

            // Note we check this is the first render AND that we have a created comm. This ensures
            // we only try to send messages when possible
            if (currentRenderCount === 0 && sendFunctionStatus === 'finished') {
                await updateMitosheetCallCellOnFirstRender();
            }
            // Anytime we render, update the render count
            await mitoAPI.updateRenderCount();
        }

        // If we are in a notebook, we need to do some work on the first render. Notably, we do not need
        // to do this work if we are in streamlit, and rather it just adds message processing overhead
        if (isInJupyterLabOrNotebook()) {
            void handleRenderInNotebook();
        }
    }, [mitoAPI, sendFunctionStatus])

    // We're storing the last analysisData in a ref so that we can check the
    // analysisData's code against the code in the cell and make sure we aren't
    // overwriting any changes the user might have made. 
    const oldCodeRef = useRef<string[] | undefined>();
    useEffect(() => {
        // If the oldCodeRef.current is undefined, then we haven't 
        // loaded the code from the saved_analysis yet. We want to load
        // this first in case Mito has been updated and the code generated
        // by Mito has changed. If we don't do this, it's hard to differentiate
        // between user changes and changes made by Mito to the generated code.
        // The next time we try to write code, it will use this saved analysis code
        // to check against. 
        if (oldCodeRef.current === undefined) {
            void mitoAPI.getSavedAnalysisCode().then((response: MitoAPIResult<string[]>) => {
                if ('error' in response) {
                    console.error(response.error);
                    return;
                }
                oldCodeRef.current = response.result;
            });
            // After setting the oldCodeRef, we return because this is supposed to represent
            // the code from the last time analysisData changed
            return;
        }
    
        props.jupyterUtils?.writeGeneratedCodeToCell(
            analysisData.analysisName, 
            analysisData.inputCellExecutionCount, 
            analysisData.code, 
            userProfile.telemetryEnabled, 
            analysisData.publicInterfaceVersion, 
            (codeWithoutUserEdits: string[], codeWithUserEdits: string[]) => {
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {
                            type: ModalEnum.UserEditedCode,
                            codeWithoutUserEdits: codeWithoutUserEdits,
                            codeWithUserEdits: codeWithUserEdits
                        }
                    }
                })
            },
            oldCodeRef.current,
            // If the oldCodeRef.current is null, this means we're accessing a saved analysis
            // that has no code field defined. In this case, we want to overwrite the code
            // in the cell, as there is no code to compare against.
            oldCodeRef.current === null ? true : undefined,
        )

        // After using the ref to get the old code, we update it to the newest analysis.
        oldCodeRef.current = analysisData.code;
        // TODO: we should store some data with analysis data to not make
        // this run too often?
    }, [analysisData])

    // Load plotly, so we can generate graphs
    useEffect(() => {
        loadPlotly()
    }, [])

    /**
     * This useEffect handles when the user creates a graph, then presses undo.
     */
    useEffect(() => {
        if (uiState.currOpenTaskpane.type === TaskpaneType.GRAPH &&
            analysisData.graphDataArray.length === 0) {
            setUIState(prevUIState => {
                return {
                    ...prevUIState,
                    currOpenTaskpane: {type: TaskpaneType.NONE},
                    selectedTabType: 'data',
                    selectedSheetIndex: 0
                }
            })
        }
    }, [analysisData.graphDataArray.length])

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

    /*
        Code to be executed everytime the sheet is switched. 
        1. if the sheet that is switched to is a pivot sheet, we start editing this pivot table
        2. if the cell editor is open, close it.
    */
    useEffect(() => {
        const openEditedPivot = async (): Promise<void> => {
            const response = await mitoAPI.getPivotParams(uiState.selectedSheetIndex);
            const existingPivotParams = 'error' in response ? undefined : response.result;

            if (existingPivotParams !== undefined) {
                setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenModal: {type: ModalEnum.None},
                        currOpenTaskpane: {
                            type: TaskpaneType.PIVOT,
                            sourceSheetIndex: existingPivotParams.sheet_index,
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

    }, [uiState]);

    /**
     * If the styling changes, we update the syling on the document. 
     * Note we don't just do this on the Mito component styles
     * because we want to be able to use the styling in dropdowns
     * that are rendered outside of the Mito component.
     */
    useEffect(() => {
        const cssVariables = getCSSStyleVariables(props.height, props.theme);
        // For each key in the theme, set it on the document style
        Object.keys(cssVariables).forEach((key) => {
            const value = (cssVariables as Record<string, any>)[key];
            document.documentElement.style.setProperty(key, value);
        })
    }, [props.theme, props.height])


    // If the user passes an onSelectionChange, then, we fire off events any time the user selects
    // a new region
    const previousSelections = useRef(gridState.selections);
    useEffect(() => {
        if (props.onSelectionChange) {
            if (!shallowEqualToDepth(previousSelections.current, gridState.selections, 2)) {
                props.onSelectionChange(
                    gridState.sheetIndex,
                    gridState.selections
                )
                previousSelections.current = gridState.selections;
            }
        }

    }, [props.onSelectionChange, gridState.selections, gridState.sheetIndex])

    const dfNames = sheetDataArray.map(sheetData => sheetData.dfName);
    const dfSources = sheetDataArray.map(sheetData => sheetData.dfSource);

    const lastStepSummary = analysisData.stepSummaryList[analysisData.stepSummaryList.length - 1];

    // Get the column id of the currently selected column. We always default to the 
    // top left corner of the last selection
    const {columnID} = getCellDataFromCellIndexes(
        sheetDataArray[uiState.selectedSheetIndex], 
        gridState.selections[gridState.selections.length - 1].startingRowIndex, 
        gridState.selections[gridState.selections.length - 1].startingColumnIndex
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
                    mitoAPI={mitoAPI}
                    userProfile={userProfile}
                />
            )
            case ModalEnum.ClearAnalysis: return (
                <ClearAnalysisModal
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                />
            )
            case ModalEnum.SignUp: return (
                <SignUpModal
                    setUIState={setUIState}
                    numUsages={userProfile.numUsages}
                    mitoAPI={mitoAPI}
                    isPro={userProfile.isPro}
                    sheetDataArray={sheetDataArray}
                    analysisData={analysisData}
                />
            )
            case ModalEnum.DashboardSignup: return (
                <StreamlitSignupModal
                    setUIState={setUIState}
                    numUsages={userProfile.numUsages}
                    mitoAPI={mitoAPI}
                    isPro={userProfile.isPro}
                    sheetDataArray={sheetDataArray}
                    analysisData={analysisData}
                />
            )
            case ModalEnum.ErrorReplayedAnalysis: return (
                <ErrorReplayedAnalysisModal
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    header={uiState.currOpenModal.header}
                    message={uiState.currOpenModal.message}
                    error={uiState.currOpenModal.error}
                    newAnalysisName={uiState.currOpenModal.newAnalysisName}
                    oldAnalysisName={uiState.currOpenModal.oldAnalysisName}
                    userProfile={userProfile}
                    overwriteAnalysisToReplayToMitosheetCall={props.jupyterUtils?.overwriteAnalysisToReplayToMitosheetCall}
                />
            )
            case ModalEnum.DeleteGraphs: return (
                <DeleteGraphsModal
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    graphDataArray={analysisData.graphDataArray}
                    sheetIndex={uiState.currOpenModal.sheetIndex}
                    dependantGraphTabNamesAndIDs={uiState.currOpenModal.dependantGraphTabNamesAndIDs}
                    dfName={sheetDataArray[uiState.currOpenModal.sheetIndex] ? sheetDataArray[uiState.currOpenModal.sheetIndex].dfName : 'this dataframe'}
                />
            )
            case ModalEnum.UserEditedCode: return (
                <UserEditedCodeModal
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    userProfile={userProfile}
                    jupyterUtils={props.jupyterUtils}
                    analysisData={analysisData}
                    codeWithoutUserEdits={uiState.currOpenModal.codeWithoutUserEdits}
                    codeWithUserEdits={uiState.currOpenModal.codeWithUserEdits}
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
                        key={'' + columnID + uiState.selectedSheetIndex + uiState.selectedColumnControlPanelTab} 
                        selectedSheetIndex={uiState.selectedSheetIndex}
                        sheetData={sheetDataArray[uiState.selectedSheetIndex]}
                        selection={gridState.selections[gridState.selections.length - 1]} 
                        gridState={gridState}
                        mitoContainerRef={mitoContainerRef}
                        setUIState={setUIState} 
                        setEditorState={setEditorState}
                        mitoAPI={mitoAPI}
                        tab={uiState.selectedColumnControlPanelTab}
                        lastStepIndex={lastStepSummary.step_idx}
                        lastStepType={lastStepSummary.step_type}
                        analysisData={analysisData}
                        closeOpenEditingPopups={closeOpenEditingPopups}
                    />
                )
            case TaskpaneType.UPGRADE_TO_PRO: return (
                <UpgradeTaskpane
                    mitoAPI={mitoAPI}
                    userProfile={userProfile}
                    setUIState={setUIState}
                    proOrEnterprise={uiState.currOpenTaskpane.proOrEnterprise}
                />
            )
            case TaskpaneType.DOWNLOAD: return (
                <DownloadTaskpane
                    dfNames={dfNames}
                    userProfile={userProfile}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                    uiState={uiState}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    sheetDataArray={sheetDataArray}
                />
            )
            case TaskpaneType.DROP_DUPLICATES: return (
                <DropDuplicatesTaskpane
                    dfNames={dfNames}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    sheetDataArray={sheetDataArray}
                    analysisData={analysisData}
                />
            )
            case TaskpaneType.GRAPH: return (
                <GraphSidebar 
                    setUIState={setUIState} 
                    uiState={uiState}
                    sheetDataArray={sheetDataArray}
                    mitoAPI={mitoAPI}
                    graphDataArray={analysisData.graphDataArray}
                    analysisData={analysisData}
                    mitoContainerRef={mitoContainerRef}
                    openGraph={uiState.currOpenTaskpane.openGraph}
                />
            )
            case TaskpaneType.IMPORT_FILES: return (
                <ImportTaskpane
                    mitoAPI={mitoAPI}
                    analysisData={analysisData}
                    userProfile={userProfile}
                    setUIState={setUIState}

                    currPathParts={currPathParts}
                    setCurrPathParts={setCurrPathParts}
                />
            )
            case TaskpaneType.MERGE: return (
                <MergeTaskpane
                    selectedSheetIndex={uiState.selectedSheetIndex}
                    sheetDataArray={sheetDataArray}
                    existingParams={uiState.currOpenTaskpane.existingParams}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    analysisData={analysisData}
                    defaultMergeType={uiState.currOpenTaskpane.defaultMergeType}
                />
            )
            case TaskpaneType.CONCAT: return (
                <ConcatTaskpane
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                />
            )
            case TaskpaneType.NONE: return (
                <Fragment/>
            )
            case TaskpaneType.PIVOT: return (
                <PivotTaskpane
                    dfNames={dfNames}
                    sheetDataArray={sheetDataArray}
                    mitoAPI={mitoAPI}
                    sourceSheetIndex={uiState.currOpenTaskpane.sourceSheetIndex}
                    analysisData={analysisData}
                    setUIState={setUIState}
                    destinationSheetIndex={uiState.currOpenTaskpane.destinationSheetIndex}
                    existingPivotParams={uiState.currOpenTaskpane.existingPivotParams}
                />
            )
            case TaskpaneType.SPLIT_TEXT_TO_COLUMNS: return (
                <SplitTextToColumnsTaskpane
                    mitoAPI={mitoAPI}
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                    setUIState={setUIState}
                    dfNames={dfNames}
                    startingColumnID={uiState.currOpenTaskpane.startingColumnID}
                />
            )
            case TaskpaneType.STEPS: return (
                <StepsTaskpane
                    stepSummaryList={analysisData.stepSummaryList}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    currStepIdx={analysisData.currStepIdx}
                    userProfile={userProfile}
                />
            )
            case TaskpaneType.IMPORT_FIRST: return (
                <DefaultEmptyTaskpane
                    setUIState={setUIState}
                    message={uiState.currOpenTaskpane.message}
                />
            )
            case TaskpaneType.FILL_NA: return (
                <FillNaTaskpane
                    setUIState={setUIState} 
                    uiState={uiState} 
                    mitoAPI={mitoAPI} 
                    selectedSheetIndex={uiState.selectedSheetIndex} 
                    sheetDataArray={sheetDataArray}   
                    analysisData={analysisData}    
                    startingColumnIDs={uiState.currOpenTaskpane.startingColumnIDs}         
                />
            )
            case TaskpaneType.MELT: return (
                <MeltTaskpane
                    userProfile={userProfile}
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                />
            )
            case TaskpaneType.SET_DATAFRAME_FORMAT: return (
                <SetDataframeFormatTaskpane
                    userProfile={userProfile}
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                />
            )
            case TaskpaneType.CONDITIONALFORMATTING: return (
                <ConditionalFormattingTaskpane
                    userProfile={userProfile}
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                    startingColumnIDs={uiState.currOpenTaskpane.startingColumnIDs}
                />
            )
            case TaskpaneType.DATAFRAMEIMPORT: return (
                <DataframeImportTaskpane
                    userProfile={userProfile}
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                />
            )
            case TaskpaneType.UPDATEIMPORTS: return (
                <UpdateImportsTaskpane
                    mitoAPI={mitoAPI}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    userProfile={userProfile}
                    analysisData={analysisData}
    
                    currPathParts={currPathParts}
                    setCurrPathParts={setCurrPathParts}
    
                    failedReplayData={uiState.currOpenTaskpane.failedReplayData}

                    overwriteAnalysisToReplayToMitosheetCall={props.jupyterUtils?.overwriteAnalysisToReplayToMitosheetCall}
                />
            )
            case TaskpaneType.CANNOTCREATECOMM: return (
                <CannotCreateCommTaskpane
                    userProfile={userProfile}
                    setUIState={setUIState}
                    commCreationErrorStatus={uiState.currOpenTaskpane.commCreationErrorStatus}
                />
            )
            case TaskpaneType.CODESNIPPETS: return (
                <CodeSnippetsTaskpane
                    userProfile={userProfile}
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                    writeCodeSnippetCell={props.jupyterUtils?.writeCodeSnippetCell}
                />
            )
            case TaskpaneType.SNOWFLAKEIMPORT: return (
                <SnowflakeImportTaskpane 
                    userProfile={userProfile}
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    selectedSheetIndex={uiState.selectedSheetIndex}          
                />
            )
            case TaskpaneType.EXCEL_RANGE_IMPORT: return (
                <ExcelRangeImportTaskpane
                    userProfile={userProfile}
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    file_path={uiState.currOpenTaskpane.file_path}
                    sheet_name={uiState.currOpenTaskpane.sheet_name}
                    sheet_names={uiState.currOpenTaskpane.sheet_names}
                />
            )
            case TaskpaneType.EXPORT_TO_FILE: return (
                <ExportToFileTaskpane
                    userProfile={userProfile}
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                />
            )
            case TaskpaneType.AITRANSFORMATION: return (
                <AITransformationTaskpane
                    userProfile={userProfile}
                    analysisData={analysisData}
                    gridState={gridState}
                    uiState={uiState}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    sheetDataArray={sheetDataArray}
                    previousAITransformParams={previousAITransformParams}
                    setPreviousAITransformParams={setPreviousAITransformParams}
                />
            )
            case TaskpaneType.CODEOPTIONS: return (
                <CodeOptionsTaskpane
                    userProfile={userProfile}
                    analysisData={analysisData}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                />
            )
            case TaskpaneType.COLUMN_HEADERS_TRANSFORM: return (
                <ColumnHeadersTransformTaskpane
                    userProfile={userProfile}
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                />
            )
            case TaskpaneType.USERDEFINEDIMPORT: return (
                <UserDefinedImportTaskpane
                    userProfile={userProfile}
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                    importer_name={uiState.currOpenTaskpane.importer_name}
                />
            )
            case TaskpaneType.USER_DEFINED_EDIT: return (
                <UserDefinedEditTaskpane
                    userProfile={userProfile}
                    analysisData={analysisData}
                    sheetDataArray={sheetDataArray}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                    selectedSheetIndex={uiState.selectedSheetIndex}
                    edit_name={uiState.currOpenTaskpane.edit_name}
                />
            )
            case TaskpaneType.GITHUB_SCHEDULE: return (
                <GithubScheduleTaskpane
                    userProfile={userProfile}
                    analysisData={analysisData}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                />
            )
            case TaskpaneType.DEV_TASKPANE: return (
                <DevTaskpane
                    userProfile={userProfile}
                    setUIState={setUIState}
                    mitoAPI={mitoAPI}
                />
            )
            // AUTOGENERATED LINE: GETCURROPENTASKPANE (DO NOT DELETE)
        }
    }

    const getCurrOpenPopup = (popupLocation: PopupLocation): JSX.Element => {
        const popupLocationInfo = uiState.currOpenPopups[popupLocation]
        switch(popupLocationInfo.type) {
            case PopupType.EphemeralMessage: 
                return (
                    <EphemeralMessage 
                        message={popupLocationInfo.message}
                        setUIState={setUIState}
                        popupLocation={popupLocation}
                    />
                )
            case PopupType.None: return (
                <Fragment/>
            )
        }
    }
            

    /*
        Actions that the user can choose to take. We abstract them into this dictionary so they can be used
        across the codebase without replicating functionality. 
    */
    const actions = getActions(
        sheetDataArray, 
        gridState, 
        dfSources, 
        closeOpenEditingPopups, 
        setEditorState, 
        uiState,
        setUIState, 
        setGridState,
        mitoAPI, 
        mitoContainerRef,
        analysisData,
        userProfile,
        sendFunctionStatus
    )

    // Check which taskpanes are open
    const taskpaneOpen = uiState.currOpenTaskpane.type !== TaskpaneType.NONE;
    const wideTaskpaneOpen = uiState.currOpenTaskpane.type === TaskpaneType.GRAPH && uiState.selectedTabType === 'graph';
    const narrowTaskpaneOpen = taskpaneOpen && !wideTaskpaneOpen;

    /* 
        We detect whether the taskpane is open in wide mode, narrow mode, or not open at all. We then
        set the class of the div containing the Mitosheet and Formula bar, as well as the taskpane div accordingly.
        The class sets the width of the sheet. 
    */
    const formulaBarAndSheetClassNames = classNames('mito-sheet-and-formula-bar-container', {
        'mito-sheet-and-formula-bar-container-wide-taskpane-open': wideTaskpaneOpen,
    })

    const taskpaneClassNames = classNames({
        'mito-taskpane-container': !taskpaneOpen,
        'mito-taskpane-container-wide': wideTaskpaneOpen,
        'mito-taskpane-container-narrow': narrowTaskpaneOpen,
    })

    const [resizingTaskpane, setResizingTaskpane] = useState(false);

    return (
        <div 
            className="mito-container" 
            data-jp-suppress-context-menu 
            ref={mitoContainerRef} 
            tabIndex={0}
            onMouseMove={(event) => {
                if (resizingTaskpane) {
                    event.preventDefault();
                    event.stopPropagation();
                    if (mitoContainerRef.current !== null) {
                        const { clientX } = event;
                        const rawTaskpaneWidth = mitoContainerRef.current.getBoundingClientRect().right - clientX;
                        const taskpaneWidth = Math.max(
                            Math.min(TASKPANE_WIDTH_MAX, rawTaskpaneWidth),
                            TASKPANE_WIDTH_MIN
                        );
                        setUIState({
                            ...uiState,
                            taskpaneWidth: taskpaneWidth
                        })
                    }
                }
            }}
            onMouseUp={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setResizingTaskpane(false);
            }}
            onKeyDown={(e) => {
                // If the user presses escape anywhere in the mitosheet, we close the editor
                if (e.key === 'Escape') {
                    if (editorState !== undefined) {
                        setEditorState(undefined)
                    } else if (uiState.currOpenTaskpane.type !== TaskpaneType.NONE && uiState.currOpenTaskpane.type !== TaskpaneType.GRAPH) {
                        setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                currOpenTaskpane: {
                                    type: TaskpaneType.NONE
                                },
                            }
                        });
                    } else if (uiState.currOpenSearch.isOpen) {
                        setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                currOpenSearch: {
                                    isOpen: false,
                                    currentMatchIndex: -1,
                                    matches: []
                                }
                            }
                        })
                        const endoGridContainer = mitoContainerRef.current?.querySelector('.endo-grid-container') as HTMLDivElement | null | undefined;
                        focusGrid(endoGridContainer);
                    } else if (uiState.currOpenDropdown !== undefined) {
                        setUIState(prevUIState => {
                            return {
                                ...prevUIState,
                                currOpenDropdown: undefined
                            }
                        })
                        const endoGridContainer = mitoContainerRef.current?.querySelector('.endo-grid-container') as HTMLDivElement | null | undefined;
                        focusGrid(endoGridContainer);
                    }
                }
                handleKeyboardShortcuts(e, actions);
            }}
            onClick={(e) => {
                const eventTarget = e.target;
                if (uiState.currOpenTaskpane.type === TaskpaneType.GRAPH &&
                    (['context-menu', 'popup-title-editor'].includes(uiState.currOpenTaskpane.currentGraphElement?.display ?? '')) &&
                    !(eventTarget instanceof HTMLInputElement && eventTarget.className.includes('popup-input'))) {
                    e.stopPropagation();
                    setUIState(prevUIState => {
                        return {
                            ...prevUIState,
                            currOpenTaskpane: {
                                ...prevUIState.currOpenTaskpane,
                                currentGraphElement: undefined
                            }
                        }
                    })
                }
            }}
        >
            <ErrorBoundary mitoAPI={mitoAPI} analyisData={analysisData} userProfile={userProfile} sheetDataArray={sheetDataArray}>
                <Toolbar 
                    mitoAPI={mitoAPI}
                    currStepIdx={analysisData.currStepIdx}
                    lastStepIndex={lastStepSummary.step_idx}
                    actions={actions}
                    mitoContainerRef={mitoContainerRef}
                    gridState={gridState}
                    setGridState={setGridState}
                    uiState={uiState}
                    setUIState={setUIState}
                    sheetData={sheetDataArray[uiState.selectedSheetIndex]}
                    sheetDataArray={sheetDataArray}
                    userProfile={userProfile}
                    editorState={editorState}
                    setEditorState={setEditorState}
                    analysisData={analysisData}
                    sheetIndex={uiState.selectedSheetIndex}
                    closeOpenEditingPopups={closeOpenEditingPopups}
                />
                <div className="mito-center-content-container" id="mito-center-content-container"> 
                    <div 
                        className={formulaBarAndSheetClassNames}
                        style={
                            narrowTaskpaneOpen 
                                ? {width: `calc(100% - ${uiState.taskpaneWidth}px)`}
                                : undefined
                        }
                    >
                        <EndoGrid
                            sheetDataArray={sheetDataArray}
                            mitoAPI={mitoAPI}
                            uiState={uiState}
                            setUIState={setUIState}
                            sheetIndex={uiState.selectedSheetIndex}
                            gridState={gridState}
                            setGridState={setGridState}
                            editorState={editorState}
                            setEditorState={setEditorState}
                            mitoContainerRef={mitoContainerRef}
                            closeOpenEditingPopups={closeOpenEditingPopups}
                            sendFunctionStatus={sendFunctionStatus}
                            analysisData={analysisData}
                            actions={actions}
                        />
                    </div>
                    {uiState.currOpenTaskpane.type !== TaskpaneType.NONE && 
                        <>
                            {uiState.currOpenTaskpane.type !== TaskpaneType.GRAPH &&
                                <div
                                    className='taskpane-resizer-container'
                                    onMouseDown={(event) => {
                                        event.preventDefault();
                                        event.stopPropagation();
                                        setResizingTaskpane(true);
                                    }}
                                >
                                    <div className='taskpane-resizer'/>
                                </div>
                            }
                            <div 
                                className={taskpaneClassNames}
                                style={
                                    narrowTaskpaneOpen 
                                        ? {width: `${uiState.taskpaneWidth}px`}
                                        : undefined
                                }
                            >
                                {getCurrOpenTaskpane()}
                            </div>
                        </>
                    }
                </div>
                <Footer
                    sheetDataArray={sheetDataArray}
                    graphDataArray={analysisData.graphDataArray}
                    gridState={gridState}
                    setGridState={setGridState}
                    mitoAPI={mitoAPI}
                    closeOpenEditingPopups={closeOpenEditingPopups}
                    uiState={uiState}
                    setUIState={setUIState}
                    mitoContainerRef={mitoContainerRef}
                    setEditorState={setEditorState}
                    actions={actions}
                />
                {getCurrentModalComponent()}
                <BottomLeftPopup
                    loading={uiState.loading}
                    sheetDataArray={sheetDataArray}
                    userProfile={userProfile}
                    analysisData={analysisData}
                    mitoAPI={mitoAPI}
                    currOpenModal={uiState.currOpenModal}
                    actions={actions}
                    setUIState={setUIState}
                />
                {getCurrOpenPopup(PopupLocation.TopRight)}
                
                {/* 
                    If the step index of the last step isn't the current step,
                    then we are out of date, and we tell the user this.
                */}
                {analysisData.currStepIdx !== lastStepSummary.step_idx && 
                    <CatchUpPopup
                        fastForward={() => {
                            void mitoAPI.updateCheckoutStepByIndex(lastStepSummary.step_idx);
                        }}
                        deleteStepsAfterIdx={() => {
                            void mitoAPI.updateUndoToStepIndex(analysisData.currStepIdx)
                        }}
                        isPro={userProfile.isPro}
                    />
                }
            </ErrorBoundary>
        </div>
    );
}


export default Mito;
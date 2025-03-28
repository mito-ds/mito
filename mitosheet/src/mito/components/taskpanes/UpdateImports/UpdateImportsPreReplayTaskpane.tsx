/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, PopupLocation, PopupType, UIState, UserProfile } from "../../../types";
import TextButton from "../../elements/TextButton";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import { TaskpaneType } from "../taskpanes";
import ImportCard from "./UpdateImportCard";
import { FailedReplayData, ReplacingDataframeState, StepImportData } from "./UpdateImportsTaskpane";
import { getErrorTextFromToFix, getOriginalAndUpdatedDataframeCreationDataPairs } from "./updateImportsUtils";


interface UpdateImportPreReplayTaskpaneProps {
    mitoAPI: MitoAPI;
    analysisData: AnalysisData;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    updatedStepImportData: StepImportData[] | undefined;
    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[] | undefined>>;

    updatedIndexes: number[];
    setUpdatedIndexes: React.Dispatch<React.SetStateAction<number[]>>;

    displayedImportCardDropdown: number | undefined
    setDisplayedImportCardDropdown: React.Dispatch<React.SetStateAction<number | undefined>>

    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    postUpdateInvalidImportMessages: Record<number, string | undefined>;
    setPostUpdateInvalidImportMessages: React.Dispatch<React.SetStateAction<Record<number, string | undefined>>>;
    
    failedReplayData: FailedReplayData;
    importDataAndErrors: ImportDataAndImportErrors | undefined

    invalidReplayError: string | undefined;
    setInvalidReplayError: React.Dispatch<React.SetStateAction<string | undefined>>;

    overwriteAnalysisToReplayToMitosheetCall?: (oldAnalysisName: string, newAnalysisName: string, mitoAPI: MitoAPI) => void
}
    

export interface ImportDataAndImportErrors {
    importData: StepImportData[],
    invalidImportMessages: Record<number, string | undefined>
}

export const PRE_REPLAY_IMPORT_ERROR_TEXT = 'Please fix failed data imports to replay analysis.';


/* 
    This taskpane is displayed if the user replays an analysis
    that has some failed imports, that the user is then given
    the option to reconfigure to make them valid.
*/
const UpdateImportsPreReplayTaskpane = (props: UpdateImportPreReplayTaskpaneProps): JSX.Element => {

    const [loadingUpdate, setLoadingUpdate] = useState(false);
    
    let updateImportBody: React.ReactNode = null;
    const loadingImportDataAndErrors = props.importDataAndErrors === undefined;

    if (props.importDataAndErrors === undefined) {
        updateImportBody = (
            <p>Loading previously imported data...</p>
        )
    } else {
        // We create an import card for each of the dataframes created within the original imports
        const originalAndUpdatedDataframeCreationPairs = getOriginalAndUpdatedDataframeCreationDataPairs(props.importDataAndErrors.importData, props.updatedStepImportData);
        updateImportBody = originalAndUpdatedDataframeCreationPairs.map(([originalDfCreationData, updatedDfCreationData], index) => {
            return (
                <ImportCard 
                    key={index}
                    dataframeCreationIndex={index}
                    dataframeCreationData={originalDfCreationData}
                    isUpdated={props.updatedIndexes.includes(index)}
                    updatedDataframeCreationData={updatedDfCreationData}
                    displayedImportCardDropdown={props.displayedImportCardDropdown}
                    setDisplayedImportCardDropdown={props.setDisplayedImportCardDropdown}
                    setReplacingDataframeState={props.setReplacingDataframeState}
                    preUpdateInvalidImportMessage={props.importDataAndErrors?.invalidImportMessages[index]}
                    postUpdateInvalidImportMessage={props.postUpdateInvalidImportMessages[index]}
                    userProfile={props.userProfile}
                    analysisData={props.analysisData}
                />
            )
        })
    }


    const allErrorsUpdated = Object.keys(props.importDataAndErrors?.invalidImportMessages || {}).filter(index => !props.updatedIndexes.includes(parseInt(index))).length === 0;
    const invalidPostUpdate = Object.keys(props.postUpdateInvalidImportMessages).length > 0;

    const retryButtonDisabled = !allErrorsUpdated || invalidPostUpdate || loadingImportDataAndErrors || loadingUpdate;

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader 
                header="Change Imports to Replay Analysis"
                setUIState={props.setUIState}           
                notCloseable
            />
            <DefaultTaskpaneBody>
                {((props.invalidReplayError === PRE_REPLAY_IMPORT_ERROR_TEXT && !allErrorsUpdated) || (props.invalidReplayError !== undefined && props.invalidReplayError !== PRE_REPLAY_IMPORT_ERROR_TEXT)) && 
                    <p className="text-color-error">
                        {props.invalidReplayError}
                    </p>
                }
                {updateImportBody}
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <Row justify="space-between">
                    <Col>
                        <TextButton
                            variant='light'
                            width='medium'
                            onClick={() => {    
                                if (props.overwriteAnalysisToReplayToMitosheetCall) {
                                    props.overwriteAnalysisToReplayToMitosheetCall(
                                        props.failedReplayData.analysisName,
                                        props.analysisData.analysisName,
                                        props.mitoAPI
                                    ) 
                                }

                                void props.mitoAPI.log('clicked_start_new_analysis_from_pre_replay_update_imports') 
                                
                                props.setUIState((prevUIState) => {
                                    return {
                                        ...prevUIState,
                                        currOpenTaskpane: {type: TaskpaneType.NONE},
                                    }
                                })}
                            }
                            tooltip={"This will start a new analysis with no steps in this mitosheet."}
                        >
                            Start New Analysis
                        </TextButton>
                    </Col>
                    <Col span={12}>
                        <TextButton 
                            variant="dark"
                            onClick={async () => {

                                const doUpdate = async () => {
                                    if (props.updatedStepImportData === undefined) {
                                        return
                                    }
                                    const response = await props.mitoAPI.getTestImports(props.updatedStepImportData);
                                    const _invalidImportIndexes = 'error' in response ? undefined : response.result;
                                    if (_invalidImportIndexes === undefined) {
                                        return;
                                    }
                                    props.setPostUpdateInvalidImportMessages(_invalidImportIndexes);

                                    void props.mitoAPI.log('clicked_update_from_pre_replay_update_imports') 
                                    void props.mitoAPI.log('get_test_import_results', {
                                        'num_invalid_imports': Object.keys(_invalidImportIndexes).length,
                                        'open_due_to_replay_error': true
                                    })

                                    // If there are no invalid indexes, then we can update. Since this is
                                    // pre replay, we are replaying the analysis
                                    if (Object.keys(_invalidImportIndexes).length === 0) {

                                        props.setInvalidReplayError(undefined) // Clear the error

                                        const replayAnalysisError = await props.mitoAPI.updateReplayAnalysis(props.failedReplayData.analysisName, props.failedReplayData.args, props.updatedStepImportData);
                                        // If there is an error replaying the analysis, we know it is not with 
                                        if ('error' in replayAnalysisError) {
                                            props.setInvalidReplayError(getErrorTextFromToFix(replayAnalysisError.error))
                                        } else {
                                            props.setUIState((prevUIState) => {
                                                return {
                                                    ...prevUIState,
                                                    currOpenTaskpane: {type: TaskpaneType.NONE},
                                                    currOpenPopups: {
                                                        ...prevUIState.currOpenPopups,
                                                        [PopupLocation.TopRight]: {
                                                            type: PopupType.EphemeralMessage, 
                                                            message: 'Successfully replayed analysis on new data'
                                                        }
                                                    }
                                                }
                                            })
                                        }
                                    }
                                }

                                setLoadingUpdate(true);
                                await doUpdate();
                                setLoadingUpdate(false);

                            }}
                            disabled={retryButtonDisabled}
                            disabledTooltip={retryButtonDisabled ? "Please resolve all errors with above imports." : undefined}
                        >
                            <p className="text-align-center-important">
                                {!loadingUpdate ? "Retry With Updated Imports" : "Updating Imports..."}
                            </p>
                        </TextButton>
                    </Col>
                </Row>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UpdateImportsPreReplayTaskpane;


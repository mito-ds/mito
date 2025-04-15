/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, PopupLocation, PopupType, SheetData, UIState, UserProfile } from "../../../types";
import TextButton from "../../elements/TextButton";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import { TaskpaneType } from "../taskpanes";
import ImportCard from "./UpdateImportCard";
import { ImportDataAndImportErrors } from "./UpdateImportsPreReplayTaskpane";
import { ReplacingDataframeState, StepImportData } from "./UpdateImportsTaskpane";
import { getErrorTextFromToFix, getOriginalAndUpdatedDataframeCreationDataPairs } from "./updateImportsUtils";
import { isInDash, isInStreamlit } from "../../../utils/location";


interface UpdateImportPostReplayTaskpaneProps {
    mitoAPI: MitoAPI;
    sheetDataArray: SheetData[];
    userProfile: UserProfile;
    analysisData: AnalysisData;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    updatedStepImportData: StepImportData[] | undefined;
    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[] | undefined>>;

    updatedIndexes: number[];
    setUpdatedIndexes: React.Dispatch<React.SetStateAction<number[]>>;
    
    displayedImportCardDropdown: number | undefined
    setDisplayedImportCardDropdown: React.Dispatch<React.SetStateAction<number | undefined>>

    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    invalidImportMessages: Record<number, string | undefined>;
    setInvalidImportMessages: React.Dispatch<React.SetStateAction<Record<number, string | undefined>>>;

    importDataAndErrors: ImportDataAndImportErrors | undefined;

    invalidReplayError: string | undefined;
    setInvalidReplayError: React.Dispatch<React.SetStateAction<string | undefined>>;
}

let PASSED_DATAFRAMES_CHANGE_MESSAGE = 'You can change imports by changing the data passed to the mitosheet.sheet call above.'
if (isInStreamlit()) {
    PASSED_DATAFRAMES_CHANGE_MESSAGE = 'You can change imports by changing the data passed to the spreadsheet call.'
}
if (isInDash()) {
    PASSED_DATAFRAMES_CHANGE_MESSAGE = 'You can change imports by changing the data passed to the Spreadsheet call.'
}
    

/* 
    This taskpane is displayed if the user wants to change the imported
    data after they have a full valid analysis.
*/
const UpdateImportsPostReplayTaskpane = (props: UpdateImportPostReplayTaskpaneProps): JSX.Element => {

    const [loadingUpdate, setLoadingUpdate] = useState(false);

    let updateImportBody: React.ReactNode = null;
    if (props.importDataAndErrors === undefined) {
        updateImportBody = (
            <p>Loading previously imported data...</p>
        )
    } else {

        // Show a different empty taskpane message depending if you passed a dataframe or not
        if ((props.importDataAndErrors?.importData.length || 0) === 0 && props.sheetDataArray.length === 0) {
            return <DefaultEmptyTaskpane setUIState={props.setUIState} message='Before changing imports, you need to import something.'/>
        } else if ((props.importDataAndErrors?.importData.length || 0) === 0) {
            return <DefaultEmptyTaskpane header='Update passed dataframes' setUIState={props.setUIState} message={PASSED_DATAFRAMES_CHANGE_MESSAGE} suppressImportLink/>

        }

        // We create an import card for each of the dataframes created within the original imports
        const originalAndUpdatedDataframeCreationPairs = getOriginalAndUpdatedDataframeCreationDataPairs(props.importDataAndErrors?.importData || [], props.updatedStepImportData);
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
                    preUpdateInvalidImportMessage={undefined}
                    postUpdateInvalidImportMessage={props.invalidImportMessages[index]}
                    userProfile={props.userProfile}
                    analysisData={props.analysisData}
                />
            )
        })
    }
    
   

    const anyUpdated = props.updatedIndexes.length > 0;
    const invalidPostUpdate = Object.keys(props.invalidImportMessages).length > 0;

    const retryButtonDisabled = !anyUpdated || invalidPostUpdate || loadingUpdate;

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader 
                header="Change Imports"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                {props.invalidReplayError &&
                    <p className="text-color-error">
                        {props.invalidReplayError}
                    </p>
                }
                {updateImportBody}
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
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

                            props.setInvalidImportMessages(_invalidImportIndexes);

                            void props.mitoAPI.log('clicked_update_from_post_replay_update_imports') 
                            void props.mitoAPI.log('get_test_import_results', {
                                'open_due_to_replay_error': false,
                                'num_invalid_imports': Object.keys(_invalidImportIndexes).length,
                            })

                            // If there are no invalid indexes, then we can update. Since this is
                            // post replay, we are updating the existing imports
                            if (Object.keys(_invalidImportIndexes).length === 0) {
                                const possibleMitoError = await props.mitoAPI.updateExistingImports(props.updatedStepImportData);
                                if ('error' in possibleMitoError) {
                                    props.setInvalidReplayError(getErrorTextFromToFix(possibleMitoError.error))
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
                    disabledTooltip={(retryButtonDisabled) ? "Please resolve all errors with above imports." : undefined}
                >
                    <p className="text-align-center-important">
                        {!loadingUpdate ? "Change Imports" : "Changing Imports..."}
                    </p>
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UpdateImportsPostReplayTaskpane;


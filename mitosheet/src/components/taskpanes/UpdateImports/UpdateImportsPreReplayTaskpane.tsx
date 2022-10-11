import React from "react";
import MitoAPI from "../../../jupyter/api";
import { UIState } from "../../../types";
import { intersection } from "../../../utils/arrays";
import { isMitoError } from "../../../utils/errors";
import TextButton from "../../elements/TextButton";
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
}
    

export interface ImportDataAndImportErrors {
    importData: StepImportData[],
    invalidImportMessages: Record<number, string | undefined>
}

const getNumImportsInvalidReplayThatAreNotUpdated = (
    preUpdateInvalidImportMessage: Record<number, string | undefined>,
    updatedIndexes: number[]
): number => {
    return Object.keys(preUpdateInvalidImportMessage).filter(index => !updatedIndexes.includes(parseInt(index))).length
}

const getErrorMessage = (
    invalidReplayError: string | undefined,
    preUpdateInvalidImportMessage: Record<number, string | undefined>,
    postUpdateInvalidImportMessage: Record<number, string | undefined>,
    updatedIndexes: number[]
): React.ReactNode => {
    const numImportsInvalidPostReplay = Object.keys(postUpdateInvalidImportMessage).length;
    const numImportsInvalidPreReplayThatAreNotUpdated = getNumImportsInvalidReplayThatAreNotUpdated(preUpdateInvalidImportMessage, updatedIndexes)

    let errorText: string | undefined = undefined;

    if (numImportsInvalidPreReplayThatAreNotUpdated > 0 || numImportsInvalidPostReplay > 0) {
        errorText = 'Please fix the failed imports below before updating imports';
    } else if (invalidReplayError !== undefined) {
        errorText = invalidReplayError;
    }

    if (errorText !== undefined) {
        return (
            <p className="text-color-error text-overflow-wrap">
                {errorText}
            </p>
        )
    }
}


/* 
    This taskpane is displayed if the user replays an analysis
    that has some failed imports, that the user is then given
    the option to reconfigure to make them valid.
*/
const UpdateImportsPreReplayTaskpane = (props: UpdateImportPreReplayTaskpaneProps): JSX.Element => {
    
    let updateImportBody: React.ReactNode = null;

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
                />
            )
        })
    }


    const numInitialErrors = Object.keys(props.importDataAndErrors?.invalidImportMessages || {}).length;
    const allErrorsUpdated = intersection(Object.keys(props.updatedIndexes), Object.keys(props.importDataAndErrors?.invalidImportMessages || {})).length === numInitialErrors;
    const invalidPostUpdate = Object.keys(props.postUpdateInvalidImportMessages).length > 0;

    // const showError = ((invalidReplayError !== undefined && Object.keys(props.updatedIndexes).length === 0) || (invalidReplayError !== undefined && invalidPostUpdate))
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Change Imports"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                {getErrorMessage(props.invalidReplayError, props.importDataAndErrors?.invalidImportMessages || {}, props.postUpdateInvalidImportMessages, props.updatedIndexes)}
                {updateImportBody}
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton 
                    variant="dark"
                    onClick={async () => {
                        
                        if (props.updatedStepImportData === undefined) {
                            return
                        }
                        const _invalidImportIndexes = await props.mitoAPI.getTestImports(props.updatedStepImportData);
                        if (_invalidImportIndexes === undefined) {
                            return;
                        }
                        props.setPostUpdateInvalidImportMessages(_invalidImportIndexes);

                        console.log("Invalid", _invalidImportIndexes);

                        // If there are no invalid indexes, then we can update. Since this is
                        // pre replay, we are replaying the analysis
                        if (Object.keys(_invalidImportIndexes).length === 0) {
                            const replayAnalysisError = await props.mitoAPI.updateReplayAnalysis(props.failedReplayData.analysisName, props.updatedStepImportData);
                            // If there is an error replaying the analysis, we know it is not with 
                            if (isMitoError(replayAnalysisError)) {
                                props.setInvalidReplayError(getErrorTextFromToFix(replayAnalysisError.to_fix))
                            } else {
                                props.setUIState((prevUIState) => {
                                    return {
                                        ...prevUIState,
                                        currOpenTaskpane: {type: TaskpaneType.NONE}
                                    }
                                })
                            }
                            
                        }
                    }}
                    // TODO: move this to pre-replay as well!
                    disabled={!allErrorsUpdated || invalidPostUpdate}
                    disabledTooltip={(!allErrorsUpdated || invalidPostUpdate) ? "Please resolve all errors with above imports." : undefined}
                >
                    <p>
                        Change Imports
                    </p>
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UpdateImportsPreReplayTaskpane;


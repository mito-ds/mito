import React, { useEffect, useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { UIState } from "../../../types";
import { isMitoError } from "../../../utils/errors";
import TextButton from "../../elements/TextButton";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import { TaskpaneType } from "../taskpanes";
import ImportCard from "./UpdateImportCard";
import { FailedReplayOnImportData, ReplacingDataframeState, StepImportData } from "./UpdateImportsTaskpane";
import { getOriginalAndUpdatedDataframeCreationDataPairs } from "./updateImportsUtils";


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

    invalidImportMessages: Record<number, string | undefined>;
    setInvalidImportMessages: React.Dispatch<React.SetStateAction<Record<number, string | undefined>>>;
    
    failedReplayAnalysisOnImports: FailedReplayOnImportData
}
    

/* 
    This taskpane is displayed if the user replays an analysis
    that has some failed imports, that the user is then given
    the option to reconfigure to make them valid.
*/
const UpdateImportsPreReplayTaskpane = (props: UpdateImportPreReplayTaskpaneProps): JSX.Element => {

    // We default the prevUpdatedStepImportData to be the the original import data, if it's undefined
    useEffect(() => {
        props.setUpdatedStepImportData(prevUpdatedStepImportData => {
            if (prevUpdatedStepImportData === undefined) {
                return JSON.parse(JSON.stringify(props.failedReplayAnalysisOnImports?.importData));
            }
            return prevUpdatedStepImportData;
        })
    }, [])

    const [invalidReplayError, setInvalidReplayError] = useState('Mito failed to replay the analysis because it could not import the files or used in the analysis. Correct the errors below.');
    
    // We create an import card for each of the dataframes created within the original imports
    const originalAndUpdatedDataframeCreationPairs = getOriginalAndUpdatedDataframeCreationDataPairs(props.failedReplayAnalysisOnImports.importData, props.updatedStepImportData);
    const updateImportCards = originalAndUpdatedDataframeCreationPairs.map(([originalDfCreationData, updatedDfCreationData], index) => {
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
                preUpdateInvalidImportMessage={props.failedReplayAnalysisOnImports.invalidImportIndexes[index]}
                postUpdateInvalidImportMessage={props.invalidImportMessages[index]}
            />
        )
    })

    const updated = props.updatedIndexes.length > 0;
    const invalid = Object.keys(props.invalidImportMessages).length > 0;

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Update Imports"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <p className="text-color-error text-overflow-wrap">
                    {invalidReplayError}
                </p>
                {updateImportCards}
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
                        props.setInvalidImportMessages(_invalidImportIndexes);

                        // If there are no invalid indexes, then we can update. Since this is
                        // pre replay, we are replaying the analysis
                        if (Object.keys(_invalidImportIndexes).length === 0) {
                            const replayAnalysisError = await props.mitoAPI.updateReplayAnalysis(props.failedReplayAnalysisOnImports.analysisName, props.updatedStepImportData);
                            // If there is an error replaying the analysis, we know it is not with 
                            if (isMitoError(replayAnalysisError)) {
                                setInvalidReplayError(replayAnalysisError.to_fix)
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
                    disabled={!updated || invalid}
                >
                    <p>
                        Update Imports
                    </p>
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UpdateImportsPreReplayTaskpane;


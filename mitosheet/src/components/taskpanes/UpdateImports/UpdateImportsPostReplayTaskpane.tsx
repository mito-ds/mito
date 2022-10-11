import React from "react";
import { useStateFromAPIAsync } from "../../../hooks/useStateFromAPIAsync";
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
import { ImportDataAndImportErrors } from "./UpdateImportsPreReplayTaskpane";
import { ReplacingDataframeState, StepImportData } from "./UpdateImportsTaskpane";
import { getErrorTextFromToFix, getOriginalAndUpdatedDataframeCreationDataPairs } from "./updateImportsUtils";


interface UpdateImportPostReplayTaskpaneProps {
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

    importDataAndErrors: ImportDataAndImportErrors | undefined;

    invalidReplayError: string | undefined;
    setInvalidReplayError: React.Dispatch<React.SetStateAction<string | undefined>>;
}
    

/* 
    This taskpane is displayed if the user wants to change the imported
    data after they have a full valid analysis.
*/
const UpdateImportsPostReplayTaskpane = (props: UpdateImportPostReplayTaskpaneProps): JSX.Element => {

    // TODO: move this to the master taskpane!
    const [originalStepImportData] = useStateFromAPIAsync(
        undefined,
        () => {return props.mitoAPI.getImportedFilesAndDataframesFromCurrentSteps()},
        (loadedData) => {
            // We default the prevUpdatedStepImportData to be the the original import data, if it's undefined
            if (loadedData !== undefined && props.updatedStepImportData === undefined) {
                props.setUpdatedStepImportData(loadedData)
            }
        },
        []
    )
    
    // We create an import card for each of the dataframes created within the original imports
    const originalAndUpdatedDataframeCreationPairs = getOriginalAndUpdatedDataframeCreationDataPairs(originalStepImportData, props.updatedStepImportData);
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
                preUpdateInvalidImportMessage={undefined}
                postUpdateInvalidImportMessage={props.invalidImportMessages[index]}
            />
        )
    })

    const anyUpdated = props.updatedIndexes.length > 0;
    const invalidPostUpdate = Object.keys(props.invalidImportMessages).length > 0;

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Change Imports"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                {props.invalidReplayError &&
                    <p className="text-color-error text-overflow-wrap">
                        {props.invalidReplayError}
                    </p>
                }
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
                        // post replay, we are updating the existing imports
                        if (Object.keys(_invalidImportIndexes).length === 0) {
                            const possibleMitoError = await props.mitoAPI.updateExistingImports(props.updatedStepImportData);
                            if (isMitoError(possibleMitoError)) {
                                props.setInvalidReplayError(getErrorTextFromToFix(possibleMitoError.to_fix))
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
                    disabled={!anyUpdated || invalidPostUpdate}
                    disabledTooltip={(!anyUpdated || invalidPostUpdate) ? "Please resolve all errors with above imports." : undefined}
                >
                    <p>
                        Change Imports
                    </p>
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UpdateImportsPostReplayTaskpane;


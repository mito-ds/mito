import React, { useState } from "react";
import { useStateFromAPIAsync } from "../../../hooks/useStateFromAPIAsync";
import MitoAPI from "../../../jupyter/api";
import { UIState } from "../../../types";
import { isMitoError } from "../../../utils/errors";
import TextButton from "../../elements/TextButton";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import ImportCard from "./UpdateImportCard";
import { ReplacingDataframeState, StepImportData } from "./UpdateImportsTaskpane";
import { getOriginalAndUpdatedDataframeCreationDataPairs } from "./updateImportsUtils";


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
}
    

/* 
    This is the updateImports taskpane.
*/
const UpdateImportsPostReplayTaskpane = (props: UpdateImportPostReplayTaskpaneProps): JSX.Element => {

    const [invalidReplayError, setInvalidReplayError] = useState<string | undefined>(undefined);

    const [originalStepImportData] = useStateFromAPIAsync(
        undefined,
        () => {return props.mitoAPI.getImportedFilesAndDataframes()},
        (loadedData) => {
            // On load, update the updated import data
            if (loadedData !== undefined && props.updatedStepImportData === undefined) {
                props.setUpdatedStepImportData(loadedData)
            }
        },
        [] // TODO: what do we want to refresh on? User applying the edit? No...
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

    const updated = props.updatedIndexes.length > 0;
    const invalid = Object.keys(props.invalidImportMessages).length > 0;

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Update Imports"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                {invalidReplayError &&
                    <p className="text-color-error text-overflow-wrap">
                        {invalidReplayError}
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
                        // pre replay, we are replaying the analysis
                        if (Object.keys(_invalidImportIndexes).length === 0) {
                            const possibleMitoError = await props.mitoAPI.updateExistingImports(props.updatedStepImportData);
                            if (isMitoError(possibleMitoError)) {
                                setInvalidReplayError(possibleMitoError.to_fix)
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

export default UpdateImportsPostReplayTaskpane;


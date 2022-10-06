import React from "react";
import MitoAPI from "../../../jupyter/api";
import { UIState } from "../../../types";
import TextButton from "../../elements/TextButton";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import ImportCard from "./UpdateImportCard";
import { ReplacingDataframeState, StepImportData } from "./UpdateImportsTaskpane";
import { getOriginalAndUpdatedDataframeCreationDataPairs, isUpdatedDfCreationData } from "./UpdateImportsUtils";


interface UpdateImportPreReplayTaskpaneProps {
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;

    updatedStepImportData: StepImportData[] | undefined;
    setUpdatedStepImportData: React.Dispatch<React.SetStateAction<StepImportData[] | undefined>>;

    displayedImportCardDropdown: number | undefined
    setDisplayedImportCardDropdown: React.Dispatch<React.SetStateAction<number | undefined>>

    setReplacingDataframeState: React.Dispatch<React.SetStateAction<ReplacingDataframeState | undefined>>;

    invalidImportMessages: Record<number, string | undefined>;
    setInvalidImportMessages: React.Dispatch<React.SetStateAction<Record<number, string | undefined>>>;
    
    failedReplayAnalysisOnImports: {
        analysisName: string,
        importData: StepImportData[],
        invalidImportIndexes: Record<number, string>
    }
}
    

/* 
    This is the updateImports taskpane.
*/
const UpdateImportsPreReplayTaskpane = (props: UpdateImportPreReplayTaskpaneProps): JSX.Element => {
    
    // We create an import card for each of the dataframes created within the original imports
    const originalAndUpdatedDataframeCreationPairs = getOriginalAndUpdatedDataframeCreationDataPairs(props.failedReplayAnalysisOnImports.importData, props.updatedStepImportData);
    const updateImportCards = originalAndUpdatedDataframeCreationPairs.map(([originalDfCreationData, updatedDfCreationData], index) => {
        return (
            <ImportCard 
                key={index}
                dataframeCreationIndex={index}
                dataframeCreationData={originalDfCreationData}
                updatedDataframeCreationData={updatedDfCreationData}
                displayedImportCardDropdown={props.displayedImportCardDropdown}
                setDisplayedImportCardDropdown={props.setDisplayedImportCardDropdown}
                setReplacingDataframeState={props.setReplacingDataframeState}
                preUpdateInvalidImportMessage={props.failedReplayAnalysisOnImports.invalidImportIndexes[index]}
                postUpdateInvalidImportMessage={props.invalidImportMessages[index]}
            />
        )
    })

    const updated = originalAndUpdatedDataframeCreationPairs.map(([originalDfCreationData, updatedDfCreationData]) => {
        return isUpdatedDfCreationData(originalDfCreationData, updatedDfCreationData);
    }).reduce((prevValue, newValue) => {return prevValue || newValue}, false);

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Update Imports"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <p className="text-color-error text-overflow-wrap">
                    Mito failed to replay the analysis because it could not import the files or used in the analysis. Correct the errors below.
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
                            void props.mitoAPI.updateReplayAnalysis(props.failedReplayAnalysisOnImports.analysisName, props.updatedStepImportData)
                        }
                    }}
                    disabled={!updated} // TODO, disable this if there is an error
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


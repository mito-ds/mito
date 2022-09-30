import React, { useEffect, useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, UIState, UserProfile } from "../../../types"
import TextButton from "../../elements/TextButton";
import { DataframeImportParams } from "../../import/DataframeImportScreen";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import { CSVImportParams } from "../FileImport/CSVImport";
import { ExcelImportParams } from "../FileImport/XLSXImport";
import ImportCard from "./ImportCard";


interface updateImportsTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
    updatedImportObjs?: UpdatedImportObj[]
}

export type UpdatedImportObj = 
    {
        step_id: string,
        type: 'csv'
        import_params: CSVImportParams
    } |
    {
        step_id: string,
        type: 'excel'
        import_params: ExcelImportParams
    } |
    {
        step_id: string
        type: 'df'
        import_params: DataframeImportParams
    }

/* 
    This is the updateImports taskpane.
*/
const updateImportsTaskpane = (props: updateImportsTaskpaneProps): JSX.Element => {

    // TODO: Depending on redo/undo/clear implementation, maybe move to useSendEditOnClick, or make a similar version of update events
    const [updatedImportObjs, setUpdatedImportObjs] = useState<UpdatedImportObj[] | undefined>(props.updatedImportObjs)
    const [displayedImportCardDropdownIndex, setDisplayedImportCardDropdownIndex] = useState<number | undefined>(undefined)

    async function loadImportedFilesAndDataframes() {
        const loadedFilesAndDataframes = await props.mitoAPI.getImportedFilesAndDataframes()
        setUpdatedImportObjs(loadedFilesAndDataframes);
    }

    useEffect(() => {
        if (updatedImportObjs === undefined) {
            void loadImportedFilesAndDataframes();
        }
    }, [])

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Update Imports"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                {updatedImportObjs !== undefined && 
                    updatedImportObjs.map((updatedImportObj, idx) => {
                        return (
                            <ImportCard 
                                key={idx}
                                setUIState={props.setUIState}
                                updatedImportObjs={updatedImportObjs}
                                importIndex={idx}    
                                displayedImportCardDropdownIndex={displayedImportCardDropdownIndex}
                                setDisplayedImportCardDropdownIndex={setDisplayedImportCardDropdownIndex}        
                            />
                        )
                    })
                }
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton 
                    variant="dark"
                    onClick={() => props.mitoAPI.updateExistingImports(updatedImportObjs || [])}
                    disabled={updatedImportObjs === undefined}
                >
                    <p>
                        Update Imports
                    </p>
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default updateImportsTaskpane;


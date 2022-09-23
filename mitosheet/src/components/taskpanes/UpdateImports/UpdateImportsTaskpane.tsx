import React, { useEffect, useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, UIState, UserProfile } from "../../../types"
import TextButton from "../../elements/TextButton";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import ImportCard from "./ImportCard";


interface updateImportsTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
    updatedImports?: UpdatedImport[]
}

export type UpdatedImport = 
    {
        step_id: string,
        type: 'csv'
        import_params: {
            file_names: string[], 
            encoding: string | undefined, 
            delimeters: string | undefined,
            error_bad_lines: boolean | undefined
        } 
    } |
    {
        step_id: string,
        type: 'excel'
        import_params: {
            file_name: string
            sheet_names: string[]
            has_headers: boolean
            skiprows: number
        }
    } |
    {
        step_id: string
        type: 'df'
        import_params: {
            df_names: string[]
        }
    }

/* 
    This is the updateImports taskpane.
*/
const updateImportsTaskpane = (props: updateImportsTaskpaneProps): JSX.Element => {

    const [updatedImports, setUpdatedImports] = useState<UpdatedImport[] | undefined>(props.updatedImports)

    async function loadImportedFilesAndDataframes() {
        const loadedFilesAndDataframes = await props.mitoAPI.getImportedFilesAndDataframes()
        setUpdatedImports(loadedFilesAndDataframes);
    }

    useEffect(() => {
        if (updatedImports === undefined) {
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
                {updatedImports !== undefined && 
                    updatedImports.map((updatedImport, idx) => {
                        return (
                            <ImportCard 
                                key={idx}
                                setUIState={props.setUIState}
                                updatedImports={updatedImports}
                                importIndex={idx}            
                            />
                        )
                    })
                }
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton 
                    variant="dark"
                    onClick={() => props.mitoAPI.updateExistingImports(updatedImports || [])}
                    disabled={updatedImports === undefined}
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


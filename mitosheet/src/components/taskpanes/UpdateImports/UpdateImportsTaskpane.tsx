import React, { useEffect, useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, SheetData, UIState, UserProfile } from "../../../types"

import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";


interface updateImportsTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}

export type UpdatedImports = 
[
    {
        step_id: string,
        type: 'csv'
        import_params: {
            file_name: string, 
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
            sheet_name: string
            has_headers: boolean
            skiprows: number
        }
    } |
    {
        step_id: string
        type: 'df'
        df_name: string
    }
]





/* 
    This is the updateImports taskpane.
*/
const updateImportsTaskpane = (props: updateImportsTaskpaneProps): JSX.Element => {

    const [updatedImports, setUpdatedImports] = useState<UpdatedImports | undefined>(undefined)

    async function loadImportedFilesAndDataframes() {
        const loadedFilesAndDataframes = await props.mitoAPI.getImportedFilesAndDataframes()
        setUpdatedImports(loadedFilesAndDataframes);
    }

    useEffect(() => {
        void loadImportedFilesAndDataframes();
    }, [])

    console.log(updatedImports)

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Update Imports"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default updateImportsTaskpane;


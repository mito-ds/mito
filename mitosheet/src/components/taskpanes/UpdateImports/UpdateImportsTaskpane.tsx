import React, { useEffect } from "react";
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





/* 
    This is the updateImports taskpane.
*/
const updateImportsTaskpane = (props: updateImportsTaskpaneProps): JSX.Element => {

    useEffect(() => {
        void props.mitoAPI.getImportedFilesAndDataframes()
    }, [])
    

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


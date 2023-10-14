import React, { useState } from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, SheetData, UIState, UserProfile } from "../../../types"

import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import TextButton from "../../elements/TextButton";
import { getDefaultUserDefinedImportParams, getNoImportMessage, UserDefinedImportParams } from "../UserDefinedImport/UserDefinedImportTaskpane";
import UserDefinedImportConfig from "../UserDefinedImport/UserDefinedImportConfig";


interface UpdateUserDefinedImportTaskpaneProps {
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    edit: (params: UserDefinedImportParams | undefined) => void;
    backCallback: () => void;
    notCloseable?: boolean;
    analysisData: AnalysisData;
    userProfile: UserProfile;
    sheetDataArray: SheetData[]
}

/* 
    This component lets you select a custom importer as the replacement 
    for a previously imported file.
*/
const UpdateUserDefinedImportScreen = (props: UpdateUserDefinedImportTaskpaneProps): JSX.Element => {

    const [params, setParams] = useState(() => getDefaultUserDefinedImportParams(props.sheetDataArray, props.analysisData));
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Custom Import"
                setUIState={props.setUIState}       
                backCallback={props.backCallback}    
            />
            <DefaultTaskpaneBody
                requiresEnterprise={{
                    featureName: "user_defined_import",
                    mitoAPI: props.mitoAPI
                }}
                userProfile={props.userProfile}
            >
                <UserDefinedImportConfig 
                    sheetDataArray={props.sheetDataArray}
                    params={params} 
                    setParams={setParams}
                    error={undefined}
                    analysisData={props.analysisData}
                />
                
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={() => props.edit(params)}
                    disabled={params === undefined}
                    disabledTooltip={getNoImportMessage()}
                >
                    Update Import
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UpdateUserDefinedImportScreen;
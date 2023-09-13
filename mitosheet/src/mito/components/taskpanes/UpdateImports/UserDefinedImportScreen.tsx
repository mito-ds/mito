import React, { useState } from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, UIState, UserProfile } from "../../../types"

import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import TextButton from "../../elements/TextButton";
import { getDefaultUserDefinedImportParams, get_no_import_message, UserDefinedImportParams } from "../UserDefinedImport/UserDefinedImportTaskpane";
import UserDefinedImportConfig from "../UserDefinedImport/UserDefinedImportConfig";


interface UpdateUserDefinedImportTaskpaneProps {
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    edit: (params: UserDefinedImportParams | undefined) => void;
    backCallback: () => void;
    notCloseable?: boolean;
    analysisData: AnalysisData;
    userProfile: UserProfile
}

/* 
    This is the UpdateSnowflakeCredentialsScreen. It is used to re-enter your snowflake
    credentials after the kernel has restarted.
*/
const UpdateUserDefinedImportScreen = (props: UpdateUserDefinedImportTaskpaneProps): JSX.Element => {

    const [params, setParams] = useState(() => getDefaultUserDefinedImportParams(props.analysisData));
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Custom Import"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody
                requiresEnterprise={{
                    featureName: "user_defined_import",
                    mitoAPI: props.mitoAPI
                }}
                userProfile={props.userProfile}
            >
                <UserDefinedImportConfig 
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
                    disabledTooltip={get_no_import_message()}
                >
                    Update Import
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UpdateUserDefinedImportScreen;
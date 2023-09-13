import React, { useState } from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types";

import useSendEditOnClickNoParams from "../../../hooks/useSendEditOnClickNoParams";
import TextButton from "../../elements/TextButton";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import { isInStreamlit } from "../../../utils/location";
import UserDefinedImportConfig, { getEmptyDefaultParamsForImporter } from "./UserDefinedImportConfig";



interface UserDefinedImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}

export interface UserDefinedImportParams {
    importer: string,
    importer_params: Record<string, string>
}

export const getDefaultUserDefinedImportParams = (
    analysisData: AnalysisData,
): UserDefinedImportParams | undefined => {

    if (analysisData.userDefinedImporters.length === 0) {
        return undefined
    }

    // Otherwise, return the first importer
    const userDefinedImporter = analysisData.userDefinedImporters[0];
    return getEmptyDefaultParamsForImporter(userDefinedImporter)
}


export const get_no_import_message = (): string => {
    let no_import_message = 'You have not defined any importers. An importer is just a function that returns a pandas dataframe.';
    if (isInStreamlit()) {
        no_import_message += ' You can define importers in the mito_component call with the `importers` parameter.';
    } else {
        no_import_message += ' You can define importers in the mitosheet.sheet call with the `importers` parameter.';
    }
    return no_import_message
}




/* 
    This is the UserDefinedImport taskpane.
*/
const UserDefinedImportTaskpane = (props: UserDefinedImportTaskpaneProps): JSX.Element => {

    const [params, setParams] = useState(() => getDefaultUserDefinedImportParams(props.analysisData));
    const [error, setError] = useState<string | undefined>(undefined);

    const {edit} = useSendEditOnClickNoParams<UserDefinedImportParams, undefined>(
        StepType.UserDefinedImport,
        props.mitoAPI,
        props.analysisData,
    )
    
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
                    error={error}
                    analysisData={props.analysisData}
                />
                
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={async () => {
                        if (params !== undefined) {
                            const error = await edit(params);
                            setError(error)
                        }
                    }}
                    disabled={params === undefined}
                    disabledTooltip={get_no_import_message()}
                >
                    Import Data
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UserDefinedImportTaskpane;
import React, { useEffect, useState } from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, SheetData, UIState, UserProfile } from "../../../types"

import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import TextButton from "../../elements/TextButton";
import { getDefaultUserDefinedImportParams, getNoImportMessage, UserDefinedImportParams } from "../UserDefinedImport/UserDefinedImportTaskpane";
import UserDefinedImportConfig from "../UserDefinedImport/UserDefinedImportConfig";
import { getDisplayNameOfPythonVariable } from "../../../utils/userDefinedFunctionUtils";


interface UpdateUserDefinedImportTaskpaneProps {
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    edit: (params: UserDefinedImportParams | undefined) => void;
    backCallback: () => void;
    notCloseable?: boolean;
    analysisData: AnalysisData;
    userProfile: UserProfile;
    sheetDataArray: SheetData[]
    importer_name: string;
}

/* 
    This component lets you select a custom importer as the replacement 
    for a previously imported file.
*/
const UpdateUserDefinedImportScreen = (props: UpdateUserDefinedImportTaskpaneProps): JSX.Element => {

    const [params, setParams] = useState(() => getDefaultUserDefinedImportParams(props.importer_name, props.sheetDataArray, props.analysisData));

    useEffect(() => {
        setParams(getDefaultUserDefinedImportParams(props.importer_name, props.sheetDataArray, props.analysisData));
    }, [props.importer_name])

    const userDefinedImporter = params !== undefined ? props.analysisData.userDefinedImporters.find(importer => importer.name === params.importer) : undefined;

    let header = 'Custom Import';
    if (userDefinedImporter !== undefined) {
        header = getDisplayNameOfPythonVariable(userDefinedImporter.name);
    }
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header={header}
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
                    importer_name={props.importer_name}
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
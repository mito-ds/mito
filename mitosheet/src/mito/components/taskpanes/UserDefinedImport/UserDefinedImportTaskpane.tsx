/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types";

import useSendEditOnClickNoParams from "../../../hooks/useSendEditOnClickNoParams";
import { isInDash, isInStreamlit } from "../../../utils/location";
import TextButton from "../../elements/TextButton";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import UserDefinedImportConfig, { getEmptyDefaultParamsForImporter } from "./UserDefinedImportConfig";
import { getDisplayNameOfPythonVariable } from "../../../utils/userDefinedFunctionUtils";



interface UserDefinedImportTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
    importer_name: string,
}

export interface UserDefinedImportParams {
    importer: string,
    importer_params: Record<string, string>
}

export const getDefaultUserDefinedImportParams = (
    importer_name: string,
    sheetDataArray: SheetData[],
    analysisData: AnalysisData,
): UserDefinedImportParams | undefined => {

    const userDefinedImporter = analysisData.userDefinedImporters.find(f => f.name === importer_name);

    if (userDefinedImporter === undefined) {
        return undefined
    }

    return getEmptyDefaultParamsForImporter(sheetDataArray, userDefinedImporter)
}


export const getNoImportMessage = (): string => {
    let noImportMessage = 'You have not defined any importers. An importer is just a function that returns a pandas dataframe.';
    if (isInStreamlit()) {
        noImportMessage += ' You can define importers in the spreadsheet call with the `importers` parameter.';
    } else if (isInDash()) {
        noImportMessage += ' You can define importers in the Spreadsheet call with the `importers` parameter.';
    } else {
        noImportMessage += ' You can define importers in the mitosheet.sheet call with the `importers` parameter.';
    }
    return noImportMessage
}


/* 
    This is the UserDefinedImport taskpane.
*/
const UserDefinedImportTaskpane = (props: UserDefinedImportTaskpaneProps): JSX.Element => {

    const [params, setParams] = useState(() => getDefaultUserDefinedImportParams(props.importer_name, props.sheetDataArray, props.analysisData));
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        setParams(getDefaultUserDefinedImportParams(props.importer_name, props.sheetDataArray, props.analysisData));
    }, [props.importer_name])

    const {edit} = useSendEditOnClickNoParams<UserDefinedImportParams, undefined>(
        StepType.UserDefinedImport,
        props.mitoAPI,
        props.analysisData,
    )

    const userDefinedImporter = params !== undefined ? props.analysisData.userDefinedImporters.find(importer => importer.name === params.importer) : undefined;

    let header = 'Custom Import';
    if (userDefinedImporter !== undefined) {
        header = getDisplayNameOfPythonVariable(userDefinedImporter.name);
    }

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader 
                header={header}
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
                    sheetDataArray={props.sheetDataArray}
                    params={params} 
                    setParams={setParams}
                    error={error}
                    analysisData={props.analysisData}
                    importer_name={props.importer_name}
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
                    disabledTooltip={getNoImportMessage()}
                >
                    Import Data
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UserDefinedImportTaskpane;
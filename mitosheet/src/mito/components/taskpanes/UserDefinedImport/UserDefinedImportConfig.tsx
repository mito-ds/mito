/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";
import { AnalysisData, SheetData, UserDefinedFunction } from "../../../types";
import { getInitialParamNameToParamValueMap } from '../../../utils/userDefinedFunctionUtils';
import UserDefinedFunctionDocumentationSection from "./UserDefinedFunctionDocumentationSection";
import UserDefinedFunctionParamConfigSection from "./UserDefinedFunctionParamConfigSection";
import { UserDefinedImportParams, getNoImportMessage } from "./UserDefinedImportTaskpane";


export const getEmptyDefaultParamsForImporter = (
    sheetDataArray: SheetData[],
    userDefinedImporter: UserDefinedFunction
): UserDefinedImportParams => {
    return {
        importer: userDefinedImporter.name,
        importer_params: getInitialParamNameToParamValueMap(sheetDataArray, userDefinedImporter.parameters)
    }
}


const UserDefinedImportImportConfig = (props: {
    sheetDataArray: SheetData[],
    params: UserDefinedImportParams | undefined
    setParams: React.Dispatch<React.SetStateAction<UserDefinedImportParams | undefined>>
    error: string | undefined
    analysisData: AnalysisData
    importer_name: string;
}): JSX.Element => {

    const params = props.params

    const userDefinedImporter = params !== undefined ? props.analysisData.userDefinedImporters.find(importer => importer.name === params.importer) : undefined;

    return (
        <>
            {userDefinedImporter !== undefined &&
                <>
                    <UserDefinedFunctionDocumentationSection
                        userDefinedFunction={userDefinedImporter}
                    />
                </>
            }
            {params === undefined &&
                <p>
                    {getNoImportMessage()}
                </p>
            }
            {params !== undefined &&
                <>
                    <UserDefinedFunctionParamConfigSection
                        paramNameToType={userDefinedImporter?.parameters}
                        params={params.importer_params}
                        setParams={(newImportParams) => {
                            props.setParams(prevParams => {
                                if (prevParams == undefined) {
                                    return prevParams;
                                }
                                return {
                                    ...prevParams,
                                    importer_params: newImportParams
                                }
                            })
                        }}
                        sheetDataArray={props.sheetDataArray}
                    />
                    {props.error !== undefined && 
                        <p className="text-color-error">{props.error}</p>
                    }
                </>
            }
        </>
    )
    
}

export default UserDefinedImportImportConfig;


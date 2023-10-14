import React, { useState } from "react";
import { MitoAPI } from "../../../api/api";
import useSendEditOnClickNoParams from '../../../hooks/useSendEditOnClickNoParams';
import { AnalysisData, SheetData, StepType, UIState, UserProfile } from "../../../types";
import { isInDash, isInStreamlit } from "../../../utils/location";
import { getDisplayNameOfPythonVariable, getInitialEmptyParameters } from "../../../utils/userDefinedFunctionUtils";

import TextButton from "../../elements/TextButton";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import UserDefinedFunctionParamConfigSection from '../UserDefinedImport/UserDefinedFunctionParamConfigSection';


interface UserDefinedEditTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}

interface UserDefinedEditParams {
    edit_name: string,
    edit_params: Record<string, string>,
}
const getDefaultParams = (
    sheetDataArray: SheetData[],
    analyisData: AnalysisData
): UserDefinedEditParams | undefined => {

    if (analyisData.userDefinedEdits.length === 0) {
        return undefined;
    }

    const editor = analyisData.userDefinedEdits[0];

    return {
        'edit_name': editor.name,
        'edit_params': getInitialEmptyParameters(sheetDataArray, editor.parameters)
    }
}

export const getNoEditorMessage = (): string => {
    let noEditorMessage = 'You have not defined any editors. An editors is just a function that takes a pandas dataframe as the first argument, and returns a pandas dataframe.';
    if (isInStreamlit()) {
        noEditorMessage += ' You can define editors in the spreadsheet call with the `editors` parameter.';
    } else if (isInDash()) {
        noEditorMessage += ' You can define editors in the Spreadsheet call with the `editors` parameter.';
    } else {
        noEditorMessage += ' You can define editors in the mitosheet.sheet call with the `editors` parameter.';
    }
    return noEditorMessage
}


/* 
    This is the User Defined Edit taskpane.
*/
const UserDefinedEditTaskpane = (props: UserDefinedEditTaskpaneProps): JSX.Element => {

    const [params, setParams] = useState(() => getDefaultParams(props.sheetDataArray, props.analysisData));
    const {edit} = useSendEditOnClickNoParams<UserDefinedEditParams, undefined>(
        StepType.UserDefinedEdit, 
        props.mitoAPI,
        props.analysisData,
    )
    const [error, setError] = useState<string | undefined>(undefined);

    const editor = props.analysisData.userDefinedEdits.find(f => f.name === params?.edit_name);

    if (params === undefined || editor === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState} message={getNoEditorMessage()}/>
    }

    const editorName = editor.name;
    const editorNameForDisplay = getDisplayNameOfPythonVariable(editorName);

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header={editorNameForDisplay}
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <UserDefinedFunctionParamConfigSection
                    sheetDataArray={props.sheetDataArray}
                    paramNameToType={editor.parameters}
                    params={params.edit_params}
                    setParams={(newEditParams) => {
                        setParams(prevParams => {
                            if (prevParams === undefined) {
                                return prevParams;
                            }
                            return {
                                ...prevParams,
                                edit_params: newEditParams
                            }
                        })
                    }}
                />
                {error !== undefined && 
                    <p className="text-color-error">{error}</p>
                }

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
                    disabledTooltip={getNoEditorMessage()}
                >
                    {editorNameForDisplay}
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default UserDefinedEditTaskpane;
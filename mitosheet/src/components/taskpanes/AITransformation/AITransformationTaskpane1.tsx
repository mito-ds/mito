import React, { useCallback, useEffect, useRef, useState } from "react";
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, ColumnHeader, GridState, IndexLabel, SheetData, StepType, UIState, UserProfile } from "../../../types";
import Col from "../../layout/Col";
import CollapsibleSection from "../../layout/CollapsibleSection";
import Row from "../../layout/Row";
import Spacer from "../../layout/Spacer";

import '../../../../css/taskpanes/AITransformation/AITransformation.css';
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";

interface AITransformationTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    gridState: GridState
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[]
    previousAITransformParams: AITransformationParams[];
    setPreviousAITransformParams: React.Dispatch<React.SetStateAction<AITransformationParams[]>>;
}

export interface AITransformationParams {
    user_input: string,
    prompt_version: string,
    prompt: string,
    completion: string,
    edited_completion: string
}

interface ColumnReconData {
    created_columns: ColumnHeader[]
    deleted_columns: ColumnHeader[]
    modified_columns: ColumnHeader[],
    renamed_columns: Record<string | number, ColumnHeader> // NOTE: this type is off!
}

export interface AITransformationResult {
    last_line_value: string | boolean | number | undefined | null,
    created_dataframe_names: string[],
    deleted_dataframe_names: string[],
    modified_dataframes_recons: Record<string, {
        'column_recon': ColumnReconData,
        'num_added_or_removed_rows': number
    }>,
    prints: string
}

export interface AICompletionSelection {
    'selected_df_name': string, 
    'selected_column_headers': ColumnHeader[], 
    'selected_index_labels': IndexLabel[]
}


const getDefaultParams = (): AITransformationParams => {
    return {
        user_input: '',
        prompt_version: '',
        prompt: '',
        completion: '',
        edited_completion: ''
    }
}

const getExample = (userInput: string, setChatInput: React.Dispatch<React.SetStateAction<string>>, setParams: React.Dispatch<React.SetStateAction<AITransformationParams>>): JSX.Element => {
    return (
        <Row 
            onClick={() => {
                setChatInput(userInput);
                setParams(getDefaultParams())
            }} 
            justify="center" align="center" className="ai-transformation-example"
        >
            <p>{userInput}</p>
        </Row>
    )
}


/* 
    This is the AITransformation taskpane.
*/
const AITransformationTaskpane = (props: AITransformationTaskpaneProps): JSX.Element => {

    const apiKeyNotDefined = props.userProfile.openAIAPIKey === null || props.userProfile.openAIAPIKey === undefined;
    const aiPrivacyPolicyAccepted = props.userProfile.aiPrivacyPolicy;


    const [chatInput, setChatInput] = useState<string>('');

    const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
    const setChatInputRef = useCallback((chatInputTextArea: HTMLTextAreaElement | null) => {
        if (chatInputTextArea !== null) {
            chatInputRef.current = chatInputTextArea;
        }
    },[]);


    const {params, setParams} = useSendEditOnClick<AITransformationParams, AITransformationResult>(
        () => getDefaultParams(),
        StepType.AiTransformation, 
        props.mitoAPI,
        props.analysisData,
        {allowSameParamsToReapplyTwice: true, doNotRefreshParamsOnUndoAndRedo: true}
    )

    useEffect(() => {
        void props.mitoAPI.log('opened_ai_transformation', {apiKeyNotDefined: apiKeyNotDefined, aiPrivacyPolicyNotAccepted: !aiPrivacyPolicyAccepted})
    }, [])

    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    const submitChatInput = async () => {
        console.log('submitting chat input', chatInput)
    }

    const chatHeight = Math.min(100, Math.max(30, 30 + (chatInput.split('\n').length - 1) * 20));

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Mito Python Copilot"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                <CollapsibleSection title={"Examples"}>
                    {getExample('delete columns with nans', setChatInput, setParams)}
                    {getExample('sort dataframe by values', setChatInput, setParams)}
                    {getExample('rename headers lowercase', setChatInput, setParams)}
                    {getExample('duplicate this dataframe', setChatInput, setParams)}
                </CollapsibleSection>
                <Spacer px={10}/>
                <DefaultTaskpaneFooter>
                    <Row justify="space-between" align="end">

                        <Col span={20} style={{height: '100%'}}>
                            <div
                                style={{
                                    height: `${chatHeight}px`,
                                    width: '100%',
                                }}
                            >

                                <textarea
                                    ref={setChatInputRef}
                                    style={{
                                        height: '100%',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                    }}
                                    value={chatInput}
                                    onChange={(e) => {
                                        setChatInput(e.target.value);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (!e.shiftKey) {
                                                e.preventDefault()
                                                submitChatInput()
                                            }
                                        }
                                    }}
                                    onKeyUp={(e) => {
                                        if (e.key === 'Enter') {
                                            if (e.shiftKey) {
                                                setChatInput(chatInput + '\n')
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </Col>
                        <Col span={4}>
                            S
                        </Col>

                    </Row>


                </DefaultTaskpaneFooter>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default AITransformationTaskpane;
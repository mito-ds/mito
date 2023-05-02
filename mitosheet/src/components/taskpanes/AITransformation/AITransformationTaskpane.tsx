import React, { useEffect, useRef, useState } from "react";
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, ColumnHeader, GridState, IndexLabel, SheetData, StepType, UIState, UserProfile } from "../../../types";
import Col from "../../layout/Col";
import Row from "../../layout/Row";

import '../../../../css/taskpanes/AITransformation/AITransformation.css';
import useSendEditOnClickNoParams from "../../../hooks/useEditOnClickNoParams";
import SendArrowIcon from "../../icons/SendArrowIcon";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import AITransformationExamplesSection from "./AITransformationExamplesSection";
import AITransformationResultSection from "./AITransformationResultSection";
import { getSelectionForCompletion } from "./aiUtils";

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

export type AICompletionOrError = {error: string} 
    | {
        user_input: string,
        prompt_version: string,
        prompt: string,
        completion: string
    } | undefined

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

/* 
    This is the AITransformation taskpane.
*/
const AITransformationTaskpane = (props: AITransformationTaskpaneProps): JSX.Element => {

    const apiKeyNotDefined = props.userProfile.openAIAPIKey === null || props.userProfile.openAIAPIKey === undefined;
    const aiPrivacyPolicyAccepted = props.userProfile.aiPrivacyPolicy;


    const [chatInput, setChatInput] = useState<string>('');
    const [loadingCompletion, setLoadingCompletion] = useState<boolean>(false);
    const [completionOrError, setCompletionOrError] = useState<AICompletionOrError>(undefined);

    const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
    const taskpaneBodyRef = useRef<HTMLDivElement | null>(null);
    const setTaskpaneBodyRef = (element: HTMLDivElement | null) => {taskpaneBodyRef.current = element;}


    const {previousParamsAndResults, loadingParams, edit, error} = useSendEditOnClickNoParams<AITransformationParams, AITransformationResult>(
        StepType.AiTransformation,
        props.mitoAPI,
        props.analysisData,
    )

    useEffect(() => {
        void props.mitoAPI.log('opened_ai_transformation', {apiKeyNotDefined: apiKeyNotDefined, aiPrivacyPolicyNotAccepted: !aiPrivacyPolicyAccepted})
    }, [])

    useEffect(() => {
        // Scroll to the bottom, when the number of chats change
        if (taskpaneBodyRef.current !== null) {
            taskpaneBodyRef.current.scrollTop = taskpaneBodyRef.current.scrollHeight;
        }

    }, [previousParamsAndResults.length])

    const submitChatInput = async () => {
        if (chatInput === '') {
            return;
        }

        setCompletionOrError(undefined); setLoadingCompletion(true);
        const completionOrError = await props.mitoAPI.getAICompletion(chatInput, getSelectionForCompletion(props.uiState, props.gridState, props.sheetDataArray));
        setCompletionOrError(completionOrError); setLoadingCompletion(false);

        setChatInput('');

        if (completionOrError !== undefined && !('error' in completionOrError)) {
            edit({
                user_input: chatInput,
                prompt_version: completionOrError.prompt_version,
                prompt: completionOrError.prompt,
                completion: completionOrError.completion,
                edited_completion: completionOrError.completion 
            })
        }
    }

    const chatHeight = Math.min(100, Math.max(30, 30 + (chatInput.split('\n').length - 1) * 20));

    const shouldDisplayExamples = previousParamsAndResults.length === 0 && !loadingParams && !loadingCompletion && completionOrError === undefined;
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Mito AI"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody setRef={setTaskpaneBodyRef}>
                {shouldDisplayExamples && 
                    <AITransformationExamplesSection
                        sheetDataArray={props.sheetDataArray}
                        setChatInput={setChatInput}
                        previousParamsAndResults={previousParamsAndResults}
                    />
                }
                <div
                    className="ai-transformation-chat-container"
                >
                    {previousParamsAndResults.map((paramAndResult) => {
                        return (
                            <>
                                <Row 
                                    justify="start" align="center"
                                    className="ai-transformation-chat-user"
                                >
                                    <p>{paramAndResult.params.user_input}</p>
                                </Row>
                                <Row 
                                    justify="start" align="center"
                                    className="ai-transformation-chat-user"
                                >
                                    <AITransformationResultSection
                                        setUIState={props.setUIState}
                                        result={paramAndResult.results}
                                        sheetDataArray={props.sheetDataArray}
                                        mitoAPI={props.mitoAPI}
                                        params={paramAndResult.params}
                                    />
                                </Row>
                            </>
                        )
                    })}
                    {loadingCompletion &&
                        <Row
                            justify="start" align="center"
                            className="ai-transformation-chat-user"
                        >
                            <p>Generating code...</p>
                        </Row>
                    }
                    {!loadingCompletion && completionOrError !== undefined && 'error' in completionOrError &&
                        <Row
                            justify="start" align="center"
                            className="ai-transformation-chat-user"
                        >
                            <p>Error generating completion...</p>
                        </Row>
                    }
                    {!loadingCompletion && loadingParams !== undefined && 
                        <Row
                            justify="start" align="center"
                            className="ai-transformation-chat-user"
                        >
                            <p>Executing code...</p>
                            <p>{loadingParams.user_input}</p>
                        </Row>
                    }
                    {error !== undefined && 
                        <Row
                            justify="start" align="center"
                            className="ai-transformation-chat-user"
                        >
                            <p>Error executing code...</p>
                            <p>{error}</p>
                        </Row>
                    }
                </div>
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <Row justify="space-between" align="end">

                    <Col span={22} style={{height: '100%'}}>
                        <div
                            style={{
                                height: `${chatHeight}px`,
                                width: '100%',
                            }}
                        >
                            <textarea
                                ref={chatInputRef}
                                className="ai-transformation-chat-input"
                                placeholder="Send a message."
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
                    <Col span={1.5} onClick={submitChatInput}>
                        <SendArrowIcon/>
                    </Col>
                </Row>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default AITransformationTaskpane;
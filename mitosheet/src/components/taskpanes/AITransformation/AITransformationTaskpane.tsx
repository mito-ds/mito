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
import LoadingCircle from "../../icons/LoadingCircle";
import { useEffectOnRedo } from "../../../hooks/useEffectOnRedo";
import { useEffectOnUndo } from "../../../hooks/useEffectOnUndo";
import AIPrivacyPolicy from "./AIPrivacyPolicy";

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

type AITransformationTaskpaneState = {
    type: 'default'
} | {
    type: 'loading completion',
    userInput: string,
} | {
    type: 'executing code',
    userInput: string,
    completion: AICompletionOrError,
} | {
    type: 'error loading completion',
    userInput: string,
} | {
    type: 'error executing code',
    userInput: string,
    attempt: number,
}

const NUMBER_OF_ATTEMPTS_TO_GET_COMPLETION = 3;

/* 
    This is the AITransformation taskpane.
*/
const AITransformationTaskpane = (props: AITransformationTaskpaneProps): JSX.Element => {

    const apiKeyNotDefined = props.userProfile.openAIAPIKey === null || props.userProfile.openAIAPIKey === undefined;
    const aiPrivacyPolicyAccepted = props.userProfile.aiPrivacyPolicy;

    const [userInput, setUserInput] = useState<string>('');
    const [taskpaneState, setTaskpaneState] = useState<AITransformationTaskpaneState>({type: 'default'});

    const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
    const setChatInputRef = (element: HTMLTextAreaElement | null) => {
        chatInputRef.current = element;
        element?.focus();
    }
    const taskpaneBodyRef = useRef<HTMLDivElement | null>(null);
    const setTaskpaneBodyRef = (element: HTMLDivElement | null) => {taskpaneBodyRef.current = element;}


    const {previousParamsAndResults, edit} = useSendEditOnClickNoParams<AITransformationParams, AITransformationResult>(
        StepType.AiTransformation,
        props.mitoAPI,
        props.analysisData,
    )

    useEffect(() => {
        void props.mitoAPI.log('opened_ai_transformation', {apiKeyNotDefined: apiKeyNotDefined, aiPrivacyPolicyNotAccepted: !aiPrivacyPolicyAccepted})
    }, [])

    useEffect(() => {
        // Scroll to the bottom, when the number of chats change, or our state changes
        if (taskpaneBodyRef.current !== null) {
            taskpaneBodyRef.current.scrollTop = taskpaneBodyRef.current.scrollHeight;
        }

    }, [previousParamsAndResults.length, taskpaneState.type])

    // If we undo or redo, we want to reset the taskpane state, so we can clear out any errors
    useEffectOnRedo(() => {setTaskpaneState({type: 'default'})}, props.analysisData)
    useEffectOnUndo(() => {setTaskpaneState({type: 'default'})}, props.analysisData)

    const submitChatInput = async (userInput: string) => {
        if (userInput === '') {
            return;
        }

        setTaskpaneState({type: 'loading completion', userInput: userInput})
        setUserInput('')

        const selections = getSelectionForCompletion(props.uiState, props.gridState, props.sheetDataArray);

        const previousFailedCompletions: [string, string][] = [];
        for (let i = 0; i < NUMBER_OF_ATTEMPTS_TO_GET_COMPLETION; i++) {
            
            const completionOrError = await props.mitoAPI.getAICompletion(
                userInput, 
                selections,
                previousFailedCompletions
            );

            if (completionOrError === undefined || 'error' in completionOrError) {
                setTaskpaneState({type: 'error loading completion', userInput: userInput})
                return;
            } else {
                setTaskpaneState({type: 'executing code', completion: completionOrError, userInput: userInput})
                const possibleError = await edit({
                    user_input: userInput,
                    prompt_version: completionOrError.prompt_version,
                    prompt: completionOrError.prompt,
                    completion: completionOrError.completion,
                    edited_completion: completionOrError.completion 
                })
                console.log(completionOrError.completion)
                
                if (possibleError !== undefined) {
                    setTaskpaneState({type: 'error executing code', userInput: userInput, attempt: i})
                    previousFailedCompletions.push([completionOrError.completion, possibleError])
                } else {
                    setTaskpaneState({type: 'default'});
                    return;
                }
            }
        }
        setTaskpaneState({type: 'error executing code', userInput: userInput, attempt: NUMBER_OF_ATTEMPTS_TO_GET_COMPLETION})
    }

    const chatHeight = Math.min(100, Math.max(30, 30 + (userInput.split('\n').length - 1) * 14));

    const shouldDisplayExamples = previousParamsAndResults.length === 0 && taskpaneState.type === 'default';

    console.log(previousParamsAndResults)


    if (!aiPrivacyPolicyAccepted) {
        return (
            <AIPrivacyPolicy mitoAPI={props.mitoAPI} setUIState={props.setUIState} />
        )
    }
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="Mito AI"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody setRef={setTaskpaneBodyRef}>
                {shouldDisplayExamples && 
                    <AITransformationExamplesSection
                        selectedSheetIndex={props.uiState.selectedSheetIndex}
                        sheetDataArray={props.sheetDataArray}
                        setChatInput={setUserInput}
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
                                    className="ai-transformation-message ai-transformation-message-user"
                                >
                                    <p>{paramAndResult.params.user_input}</p>
                                </Row>
                                <Row 
                                    justify="start" align="center"
                                    className="ai-transformation-message ai-transformation-message-ai"
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
                    {(taskpaneState.type === 'loading completion' || taskpaneState.type === 'executing code') &&
                        <>
                            <Row
                                justify="start" align="center"
                                className="ai-transformation-message ai-transformation-message-user"
                            >
                                <p>{taskpaneState.userInput}</p>
                            </Row>
                            <Row
                                justify="space-between" align="center"
                                className="ai-transformation-message ai-transformation-message-ai"
                            >
                                <Col>
                                    {
                                        taskpaneState.type === 'loading completion' 
                                            ? <p>Generating code...</p>
                                            : <p>Executing code...</p>
                                    }
                                </Col>
                                <Col>
                                    <LoadingCircle/>
                                </Col>
                            </Row>
                        </>
                    }
                    {taskpaneState.type === 'error loading completion' &&
                        <>
                            <Row
                                justify="start" align="center"
                                className="ai-transformation-message ai-transformation-message-user"
                            >
                                <p>{taskpaneState.userInput}</p>
                            </Row>
                            <Row
                                justify="start" align="center"
                                className="ai-transformation-message ai-transformation-message-ai"
                            >
                                <p>Error loading completion. This is likely because you are not connected to the internet, or there is a firewall blocking OpenAI.</p>
                            </Row>
                        </>
                    }
                    {taskpaneState.type === 'error executing code' &&
                        <>
                            <Row
                                justify="start" align="center"
                                className="ai-transformation-message ai-transformation-message-user"
                            >
                                <p>{taskpaneState.userInput}</p>
                            </Row>
                            <Row
                                justify="start" align="center"
                                className="ai-transformation-message ai-transformation-message-ai"
                            >
                                    <p>
                                        Error executing code. 
                                        {
                                            taskpaneState.attempt < NUMBER_OF_ATTEMPTS_TO_GET_COMPLETION
                                            ? `Trying again (Attempt ${taskpaneState.attempt + 1}/${NUMBER_OF_ATTEMPTS_TO_GET_COMPLETION})` 
                                            : 'Please change the prompt and try again.'
                                        }
                                    </p>
                            </Row>
                        </>
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
                                ref={setChatInputRef}
                                className="ai-transformation-user-input-text-area"
                                placeholder="Send a message."
                                value={userInput}
                                onChange={(e) => {
                                    setUserInput(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (!e.shiftKey) {
                                            e.preventDefault()
                                            void submitChatInput(userInput)
                                        }
                                    }
                                }}
                                onKeyUp={(e) => {
                                    if (e.key === 'Enter') {
                                        if (e.shiftKey) {
                                            setUserInput(userInput + '\n')
                                        }
                                    }
                                }}
                            />
                        </div>
                    </Col>
                    <Col span={1.5} onClick={() => {void submitChatInput(userInput)}}>
                        <SendArrowIcon/>
                    </Col>
                </Row>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default AITransformationTaskpane;
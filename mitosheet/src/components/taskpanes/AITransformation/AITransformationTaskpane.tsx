import React, { useEffect, useRef, useState } from "react";
import MitoAPI from "../../../api/api";
import { AnalysisData, ColumnHeader, GridState, IndexLabel, SheetData, StepType, UIState, UserProfile } from "../../../types";
import Col from "../../layout/Col";
import Row from "../../layout/Row";

import '../../../../css/taskpanes/AITransformation/AITransformation.css';
import useSendEditOnClickNoParams from "../../../hooks/useSendEditOnClickNoParams";
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
import { DOCUMENTATION_LINK_AI_TRANSFORM } from "../../../data/documentationLinks";

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
    error: string
} | {
    type: 'error executing code',
    userInput: string,
    error: string,
    attempt: number,
}

const NUMBER_OF_ATTEMPTS_TO_GET_COMPLETION = 3;

const AILoadingCircle = (): JSX.Element => {
    return (
        <Col>
            <LoadingCircle/>
        </Col>
    )
}

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
        if (chatInputRef.current === null) {
            chatInputRef.current = element;
            element?.focus();
        }
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
                setTaskpaneState({type: 'error loading completion', userInput: userInput, error: completionOrError?.error || 'There was an error accessing the OpenAI API. This is likely due to internet connectivity problems or a firewall.'})
                return;
            } else {
                // TODO: this sucks. There are two types of errors. That's not good
                const completion = completionOrError.result;
                if ('error' in completion) {
                    setTaskpaneState({type: 'error loading completion', userInput: userInput, error: completion.error || 'There was an error accessing the OpenAI API. This is likely due to internet connectivity problems or a firewall.'})
                    return;
                }

                setTaskpaneState({type: 'executing code', completion: completion, userInput: userInput})
                const possibleError = await edit({
                    user_input: userInput,
                    prompt_version: completion.prompt_version,
                    prompt: completion.prompt,
                    completion: completion.completion,
                    edited_completion: completion.completion 
                })
                
                if (possibleError !== undefined) {
                    setTaskpaneState({type: 'error executing code', userInput: userInput, attempt: i, error: possibleError})
                    previousFailedCompletions.push([completion.completion, possibleError])
                } else {
                    setTaskpaneState({type: 'default'});
                    return;
                }
            }
        }
        setTaskpaneState(prevTaskpaneState => {
            if (prevTaskpaneState.type === 'error executing code') {
                return {...prevTaskpaneState, attempt: prevTaskpaneState.attempt + 1}
            } else {
                return prevTaskpaneState;
            }
        })
    }

    const chatHeight = Math.min(100, Math.max(30, 30 + (userInput.split('\n').length - 1) * 14));

    const shouldDisplayExamples = previousParamsAndResults.length === 0 && taskpaneState.type === 'default';

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
                        setUserInput={setUserInput}
                        previousParamsAndResults={previousParamsAndResults}
                        chatInputRef={chatInputRef}
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
                    {taskpaneState.type === 'loading completion' &&
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
                                    <p>Generating code...</p>
                                </Col>
                                <AILoadingCircle/>
                            </Row>
                        </>
                    }
                    {taskpaneState.type === 'executing code' &&
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
                                    <p>Executing code...</p>
                                </Col>
                                <AILoadingCircle/>
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
                                <div className="flexbox-column">
                                    <p>
                                        Error loading completion
                                    </p>
                                    <p>
                                        {
                                            taskpaneState.error
                                        } 
                                        {/** Display additional calls to action if they are relevant */}
                                        {taskpaneState.error.includes('There was an error accessing the OpenAI API') && 
                                            <>
                                                To learn about self-hosted LLMs for Mito Enterprise, contact <a className='text-underline text-color-mito-purple' href="mailto:founders@sagacollab.com?subject=Mito Enterprise AI">the Mito team</a>.
                                            </>
                                        }
                                        {taskpaneState.error.includes('You have used Mito AI 20 times') && 
                                            <>
                                                Please <a className='text-underline' href="https://trymito.io/plans" target='_blank' rel="noreferrer">upgrade to Mito Pro</a> or <a className='text-underline' href={DOCUMENTATION_LINK_AI_TRANSFORM} target='_blank' rel="noreferrer">set your own OPENAI_API key in your environment variables.</a>
                                            </>
                                        }
                                    </p>
                                </div>
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
                                justify="space-between" align="center"
                                className="ai-transformation-message ai-transformation-message-ai"
                            >
                                <div className="flexbox-column">
                                    <p>
                                        Execution failed. {
                                            taskpaneState.attempt < NUMBER_OF_ATTEMPTS_TO_GET_COMPLETION
                                                ? `Trying again (Attempt ${taskpaneState.attempt + 1}/${NUMBER_OF_ATTEMPTS_TO_GET_COMPLETION})` 
                                                : 'Please change the prompt and try again.'
                                        }
                                    </p>
                                    {/** We only display the final error as otherwise it flickers too much */}
                                    {taskpaneState.attempt >= NUMBER_OF_ATTEMPTS_TO_GET_COMPLETION &&
                                        <code>
                                            {
                                                taskpaneState.error
                                            }
                                        </code>
                                    }
                                </div>
                                {taskpaneState.attempt < NUMBER_OF_ATTEMPTS_TO_GET_COMPLETION &&
                                    <AILoadingCircle/>
                                }
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
                    <Col span={1.5} onClick={() => {
                        void submitChatInput(userInput)
                        chatInputRef.current?.focus()
                    }}>
                        <SendArrowIcon/>
                    </Col>
                </Row>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default AITransformationTaskpane;
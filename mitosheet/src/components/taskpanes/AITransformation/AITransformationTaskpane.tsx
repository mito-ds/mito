import React, { useState } from "react";
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import MitoAPI from "../../../jupyter/api";
import { AnalysisData, ColumnHeader, GridState, IndexLabel, SheetData, StepType, UIState, UserProfile } from "../../../types";
import TextArea from "../../elements/TextArea";
import TextButton from "../../elements/TextButton";
import Col from "../../layout/Col";
import CollapsibleSection from "../../layout/CollapsibleSection";
import Row from "../../layout/Row";
import Spacer from "../../layout/Spacer";

import '../../../../css/taskpanes/AITransformation/AITransformation.css';
import { getColumnHeadersInSelections, getIndexLabelsInSelections } from "../../endo/selectionUtils";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import AITransformationResultSection from "./AITransformationResultSection";
import { shallowEqual } from "../../../utils/objects";
import { DOCUMENTATION_LINK_AI_TRANSFORM } from "../../../data/documentationLinks";

interface AITransformationTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    gridState: GridState
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[]
}

export interface AITransformationParams {
    user_input: string,
    prompt_version: string,
    prompt: string,
    completion: string,
    edited_completion: string
}

interface ColumnReconData {
    added_columns: ColumnHeader[]
    removed_columns: ColumnHeader[]
    modified_columns: ColumnHeader[],
    renamed_columns: Record<string | number, ColumnHeader> // NOTE: this type is off!
}
export interface AITransformationResult {
    last_line_value: string | boolean | number | undefined | null,
    created_dataframe_names: string[],
    deleted_dataframe_names: string[],
    modified_dataframes_column_recons: Record<string, ColumnReconData>,
}

interface PromptState {
    userInput: string, 
    error: string | undefined, 
    hint: string | undefined,
    loading: boolean
}

interface SectionState {
    'Examples': boolean,
    'Prompt': boolean,
    'Result': boolean
}

export interface CompletionSelection {
    'selected_df_name': string, 
    'selected_column_headers': ColumnHeader[], 
    'selected_index_labels': IndexLabel[]
}

const HINTS = [
    'You can edit the generated code below before executing it. This can allow you to fix up minor errors.',
    'Check the Results section to see how the generated code effected your dataframes.',
    'Edit not apply correctly? Just press Undo in the toolbar to undo the edit.',
]

const getDefaultParams = (): AITransformationParams | undefined => {
    return {
        user_input: '',
        prompt_version: '',
        prompt: '',
        completion: '',
        edited_completion: ''
    }
}

const getExample = (userInput: string, setPromptState: React.Dispatch<React.SetStateAction<PromptState>>, setOpenSections: React.Dispatch<React.SetStateAction<SectionState>>): JSX.Element => {
    return (
        <Col 
            onClick={() => {
                setPromptState({userInput: userInput, error: undefined, hint: undefined, loading: false});
                setOpenSections(prevOpenSections => {return {...prevOpenSections, 'Examples': false, 'Prompt': true}})
            }} 
            span={11}
        >
            <Row justify="center" align="center" className="ai-transformation-example">
                <p>{userInput}</p>
            </Row>
        </Col>
    )
}

const getSelectionForCompletion = (uiState: UIState, gridState: GridState, sheetDataArray: SheetData[]): CompletionSelection | undefined => {
    const selectedSheetIndex = uiState.selectedSheetIndex;
    const sheetData = sheetDataArray[selectedSheetIndex];

    if (sheetData === undefined) {
        return undefined;
    }

    const dfName = sheetData.dfName;
    const selectedColumnHeaders = getColumnHeadersInSelections(gridState.selections, sheetData);
    const selectedIndexLabels = getIndexLabelsInSelections(gridState.selections, sheetData);
    

    return {
        'selected_df_name': dfName,
        'selected_column_headers': selectedColumnHeaders,
        'selected_index_labels': selectedIndexLabels
    }
}

const getCurrentlySelectedParamsIndex = (previousParams: AITransformationParams[], currParams: AITransformationParams): number => {
    const index = previousParams.findIndex(params => shallowEqual(params, currParams));
    return index === -1 ? previousParams.length : index;
}

/**
 * A helper function for updating the previous params list. If the current params are currently already on the array, then we simply
 * overwrite this final entry. Otherwise, we append them to the list
 */
const getNewPreviousParams = (previousParams: AITransformationParams[], currParams: AITransformationParams, newParams: AITransformationParams): AITransformationParams[] => {
    if (previousParams.length === 0) {
        return [newParams];
    }

    const newPreviousParams = [...previousParams];
    const previousParam = newPreviousParams[newPreviousParams.length - 1];
    if (previousParam !== undefined && shallowEqual(previousParam, currParams)) {
        newPreviousParams[newPreviousParams.length - 1] = newParams
    } else {
        newPreviousParams.push(newParams);
    }

    return newPreviousParams;
}


/* 
    This is the AITransformation taskpane.
*/
const AITransformationTaskpane = (props: AITransformationTaskpaneProps): JSX.Element => {

    const apiKeyNotDefined = props.userProfile.openAIAPIKey === null || props.userProfile.openAIAPIKey === undefined;

    const [openSections, setOpenSections] = useState<SectionState>({
        'Examples': true,
        'Prompt': true,
        'Result': false
    })

    const [promptState, setPromptState] = useState<PromptState>({
        userInput: '',
        error: undefined,
        hint: undefined,
        loading: false
    });

    const [previousParams, setPreviousParams] = useState<AITransformationParams[]>([])

    const {params, setParams, edit, result, error} = useSendEditOnClick<AITransformationParams, AITransformationResult>(
        () => getDefaultParams(),
        StepType.AiTransformation, 
        props.mitoAPI,
        props.analysisData,
        {allowSameParamsToReapplyTwice: true}
    )

    if (params === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }


    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header="AI Transformation"
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody>
                {apiKeyNotDefined && 
                    <p className="text-color-error">
                        You do not have an OPEN_AI_KEY set in your enviornment variables. To activate this feature, follow the <a className='text-underline' href={DOCUMENTATION_LINK_AI_TRANSFORM} target='_blank' rel="noreferrer">instructions here.</a>
                    </p>
                
                }
                <CollapsibleSection title={"Examples"} open={openSections['Examples']} disabled={apiKeyNotDefined}>
                    <Row justify="space-between" align="center">
                        {getExample('delete columns with nans', setPromptState, setOpenSections)}
                        {getExample('cleanup column dtypes', setPromptState, setOpenSections)}
                    </Row>
                    <Row justify="space-between" align="center">
                        {getExample('rename headers lowercase', setPromptState, setOpenSections)}
                        {getExample('duplicate this dataframe', setPromptState, setOpenSections)}
                    </Row>
                </CollapsibleSection>
                <Spacer px={10}/>
                <CollapsibleSection title={"Prompt"} open={openSections['Prompt']} disabled={apiKeyNotDefined}>
                    <TextArea 
                        value={promptState.userInput} 
                        placeholder='delete columns with nans'
                        onChange={(e) => {
                            const newUserInput = e.target.value;
                            setPromptState({userInput: newUserInput, error: undefined, hint: undefined, loading: false});
                        }}
                        height='small'
                        autoFocus
                        darkBorder
                    />
                    <TextButton
                        onClick={async () => {
                            const randomHint = HINTS[Math.floor(Math.random() * HINTS.length)];
                            setPromptState(prevPromptState => {return {...prevPromptState, loading: true, hint: randomHint}})

                            const currentSelection = getSelectionForCompletion(props.uiState, props.gridState, props.sheetDataArray);
                            const completionOrError = await props.mitoAPI.getAICompletion(promptState.userInput, currentSelection);
                            if (completionOrError !== undefined && 'completion' in completionOrError) {
                                const newParams = {...completionOrError, edited_completion: completionOrError.completion};
                                setParams(newParams);
                                setPreviousParams(prevPreviousParams => {
                                    const newPreviousParams = [...prevPreviousParams];
                                    newPreviousParams.push(newParams);
                                    return newPreviousParams;
                                })
                                setOpenSections(prevOpenSections => {return {...prevOpenSections, 'Examples': false, 'Result': false}})
                            } else if (completionOrError !== undefined && 'error' in completionOrError){
                                setPromptState(prevPromptState => {
                                    return {
                                        ...prevPromptState,
                                        error: completionOrError.error
                                    }
                                })
                            }

                            setPromptState(prevPromptState => {return {...prevPromptState, loading: false}})
                        }}
                        disabled={promptState.userInput.length === 0 || promptState.loading}
                        variant='dark'
                    >
                        Generate Code
                    </TextButton>
                    {promptState.error !== undefined && 
                        <p className="text-color-error">{promptState.error}</p>
                    }
                    {promptState.loading && 
                        <p className="text-subtext-1">Generating code... {promptState.hint !== undefined ? `Hint: ${promptState.hint}` : ''}</p>
                    }
                    <Spacer px={10}/>
                    <TextArea 
                        value={params.edited_completion} 
                        placeholder='df["column"] = True'
                        onChange={(e) => {
                            const newEditedCompletion = e.target.value;

                            const newParams = {
                                ...params,
                                edited_completion: newEditedCompletion
                            };

                            // Save these new previous params
                            setPreviousParams(prevPreviousParams => {
                                return getNewPreviousParams(prevPreviousParams, params, newParams);
                            })

                            setParams(prevParams => {
                                return {
                                    ...prevParams,
                                    edited_completion: newEditedCompletion
                                }
                            });
                        }}
                        height={
                            // We shrink the box if the code is small
                            params.completion.trim().split(/\r\n|\r|\n/).length < 5
                                ? 'small' : 'medium'
                        } 
                        disabled={params.edited_completion.length === 0 || promptState.loading}
                        darkBorder
                    />
                    <TextButton 
                        onClick={() => {
                            edit();
                        }}
                        variant='dark'
                        disabled={params.edited_completion.length === 0 || promptState.loading}
                    >
                        Execute Generated Code
                    </TextButton>
                    {error !== undefined &&
                        <p className="text-color-error">{error}</p>
                    }
                    {previousParams.length > 1 && 
                        <Row justify="space-around" align="center" suppressTopBottomMargin>
                            <Col className="text-subtext-1">
                                <Row suppressTopBottomMargin>
                                    <Col
                                        onClick={() => {
                                            const currentIndex = getCurrentlySelectedParamsIndex(previousParams, params);
                                            const newIndex = currentIndex - 1;
                                            if (newIndex < 0) {
                                                return;
                                            }
                                            const newParams = previousParams[newIndex];
                                            setParams(newParams);
                                            setPromptState({userInput: newParams.user_input, error: undefined, hint: undefined, loading: false});
                                        }}
                                    >
                                        ◀ &nbsp;
                                    </Col>
                                    <Col>Your Prompts ({getCurrentlySelectedParamsIndex(previousParams, params) + 1} / {previousParams.length})</Col>
                                    <Col
                                        onClick={() => {
                                            const currentIndex = getCurrentlySelectedParamsIndex(previousParams, params);
                                            const newIndex = currentIndex + 1;
                                            if (newIndex > previousParams.length - 1) {
                                                return;
                                            }
                                            const newParams = previousParams[newIndex];
                                            setParams(newParams);
                                            setPromptState({userInput: newParams.user_input, error: undefined, hint: undefined, loading: false});
                                        }}
                                    >
                                        &nbsp; ▶
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    }
                </CollapsibleSection>
                <Spacer px={10}/>
                <CollapsibleSection 
                    title={"Result"} 
                    open={openSections['Result'] || result !== undefined}
                    disabled={result === undefined}
                >
                    <AITransformationResultSection
                        setUIState={props.setUIState}
                        result={result}
                        sheetDataArray={props.sheetDataArray}
                        mitoAPI={props.mitoAPI}
                        params={params}
                    />
                </CollapsibleSection>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default AITransformationTaskpane;
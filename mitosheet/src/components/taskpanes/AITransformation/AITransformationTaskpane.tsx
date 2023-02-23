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

interface AITransformationTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    gridState: GridState
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[]
}

interface AITransformationParams {
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
    loading: boolean
}

interface SectionState {
    'Examples': boolean,
    'Prompt': boolean,
    'Generated Code': boolean,
    'Result': boolean
}

export interface CompletionSelection {
    'selected_df_name': string, 
    'selected_column_headers': ColumnHeader[], 
    'selected_index_labels': IndexLabel[]
}

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
                setPromptState({userInput: userInput, error: undefined, loading: false});
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


/* 
    This is the AITransformation taskpane.
*/
const AITransformationTaskpane = (props: AITransformationTaskpaneProps): JSX.Element => {

    const [openSections, setOpenSections] = useState<SectionState>({
        'Examples': true,
        'Prompt': true,
        'Generated Code': false,
        'Result': false
    })

    const [promptState, setPromptState] = useState<PromptState>({
        userInput: '',
        error: undefined,
        loading: false
    });

    const {params, setParams, edit, editApplied, result, error} = useSendEditOnClick<AITransformationParams, AITransformationResult>(
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
                <CollapsibleSection title={"Examples"} open={openSections['Examples']}>
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
                <CollapsibleSection title={"Prompt"} open={openSections['Prompt']}>
                    <TextArea 
                        value={promptState.userInput} 
                        placeholder='delete columns with nans'
                        onChange={(e) => {
                            const newUserInput = e.target.value;
                            setPromptState({userInput: newUserInput, error: undefined, loading: false});
                        }}
                        height='small'
                    />
                    <TextButton
                        onClick={async () => {
                            setPromptState(prevPromptState => {return {...prevPromptState, loading: true}})
                            const currentSelection = getSelectionForCompletion(props.uiState, props.gridState, props.sheetDataArray);
                            const completionOrError = await props.mitoAPI.getAICompletion(promptState.userInput, currentSelection);
                            if (completionOrError !== undefined && 'completion' in completionOrError) {
                                console.log("COMPLETION", completionOrError.prompt)
                                setParams({...completionOrError, edited_completion: completionOrError.completion});
                                setOpenSections(prevOpenSections => {
                                    return {
                                        ...prevOpenSections,
                                        'Examples': false,
                                        'Prompt': false,
                                        'Generated Code': true
                                    }
                                })
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
                        disabled={promptState.loading}
                        variant='dark'
                    >
                        Generate Code
                    </TextButton>
                    {promptState.error !== undefined && 
                        <p className="text-color-error">{promptState.error}</p>
                    }
                    {promptState.loading && 
                        <p className="text-subtext-1">Generating code...</p>
                    }
                </CollapsibleSection>
                <Spacer px={10}/>
                <CollapsibleSection title={"Generated Code"} open={openSections['Generated Code']}>
                    <TextArea 
                        value={params.edited_completion} 
                        placeholder='df["column"] = True'
                        onChange={(e) => {
                            const newEditedCompletion = e.target.value;
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
                    />
                    <Row justify="space-between">
                        {editApplied && 
                            <Col span={6}>
                                <TextButton 
                                    onClick={() => {
                                        // First, we undo
                                        props.mitoAPI.updateUndo()


                                    }}
                                    variant='dark'
                                    width="small"
                                >
                                    Undo
                                </TextButton>
                            </Col>
                        }
                        <Col span={editApplied ? 17 : 24}>
                            <TextButton 
                                onClick={() => {edit()}}
                                variant='dark'
                            >
                                Execute Generated Code
                            </TextButton>
                        </Col>
                    </Row>
                    {error !== undefined &&
                        <p className="text-color-error">{error}</p>
                    }
                </CollapsibleSection>
                <Spacer px={10}/>
                <CollapsibleSection title={"Result"} open={openSections['Result'] || result?.last_line_value !== undefined}>
                    <AITransformationResultSection
                        setUIState={props.setUIState}
                        result={result}
                        sheetDataArray={props.sheetDataArray}
                        mitoAPI={props.mitoAPI}
                    />
                </CollapsibleSection>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default AITransformationTaskpane;
/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from "react";
import { AITransformationResult, SheetData, UIState } from "../../../types";

import '../../../../../css/taskpanes/AITransformation/AITransformation.css';
import { MitoAPI } from "../../../api/api";
import { classNames } from "../../../utils/classNames";
import { getDisplayColumnHeader } from "../../../utils/columnHeaders";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import { AITransformationParams } from "./AITransformationTaskpane";
import EyeIcon from "../../icons/EyeIcon";

interface AITransformationResultSectionProps {
    mitoAPI: MitoAPI;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    result: AITransformationResult | undefined;
    sheetDataArray: SheetData[]
    params: AITransformationParams
    isMostRecentResult: boolean
    setDisplayRecon: React.Dispatch<React.SetStateAction<boolean>>
}

const AITransformationResultSection = (props: AITransformationResultSectionProps): JSX.Element => {

    const [sentFeedback, setSentFeedback] = useState<'Up' | 'Down' | undefined>(undefined);
    
    const result = props.result;

    if (result === undefined) {
        return <></>
    }

    const logParams: Record<string, unknown> = {
        prompt_version: props.params.prompt_version,
        prompt: props.params.prompt.split('\n'),
        completion: props.params.completion.split('\n'),
        edited_completion: props.params.edited_completion.split('\n')
    }


    return (
        <div
            className="ai-transformation-result-section"
        >
            <Row justify="space-between">
                <Col span={22}>
                    {result.last_line_value !== undefined && result.last_line_value !== null && 
                        <p><span>Value:</span> {result.last_line_value}</p>
                    }
                    {result.prints.length > 0 && 
                        <>
                            <p><span>Printed:</span></p>
                            <pre>{result.prints}</pre>
                        </>
                    }
                    {result.created_dataframe_names.map(dfName => {
                        const sheetIndex = props.sheetDataArray.findIndex(sd => sd.dfName === dfName);
                        const sheetData = props.sheetDataArray[sheetIndex];
                        const numRows = sheetData?.numRows || 0;
                        const numColumns = sheetData?.numColumns || 0;
                        return (
                            <div 
                                key={dfName}
                                onClick={() => {
                                    props.setUIState(prevUIState => {
                                        return {
                                            ...prevUIState,
                                            selectedSheetIndex: sheetIndex !== -1 ? sheetIndex : prevUIState.selectedSheetIndex
                                        }
                                    })
                                }}>
                                <span className={classNames({'text-color-recon-created': props.isMostRecentResult})}>Created:</span> <span className="text-underline">{dfName}</span>  ({numRows} rows, {numColumns} columns)
                            </div>
                        )
                    })}
                    {Object.entries(result.modified_dataframes_recons).map(([dfName, modifiedDataframeRecon]) => {
                        const columnReconData = modifiedDataframeRecon.column_recon;
                        const sheetIndex = props.sheetDataArray.findIndex(sd => sd.dfName === dfName);
                        const rowChange = modifiedDataframeRecon.num_added_or_removed_rows;
                        const rowChangeTest = rowChange !== 0 ? (rowChange < 0 ? `(Removed ${rowChange * -1} rows)` : `(Added ${rowChange} rows)`) : undefined;
                        return (
                            <div key={dfName}>
                                <div 
                                    onClick={() => {
                                        props.setUIState(prevUIState => {
                                            return {
                                                ...prevUIState,
                                                selectedSheetIndex: sheetIndex !== -1 ? sheetIndex : prevUIState.selectedSheetIndex
                                            }
                                        })
                                    }}>
                                    <span className={classNames({'text-color-recon-modified': props.isMostRecentResult})}>Modified:</span> <span className="text-underline">{dfName}</span> {rowChangeTest}
                                </div>
                                {columnReconData.created_columns.map((ch, index) => {
                                    return <div key={dfName + 'added' + index} className="ml-5px"><span className={classNames({'text-color-recon-created': props.isMostRecentResult})}>Added column: </span>{getDisplayColumnHeader(ch)}</div>
                                })}
                                {columnReconData.modified_columns.map((ch, index) => {
                                    return <div key={dfName + 'modified' + index} className="ml-5px"><span className={classNames({'text-color-recon-modified': props.isMostRecentResult})}>Modified column: </span>{getDisplayColumnHeader(ch)}</div>
                                })}
                                {Object.entries(columnReconData.renamed_columns).map(([oldCh, newCh], index) => {
                                    return <div key={dfName + 'renamed' + index} className="ml-5px"><span className={classNames({'text-color-recon-modified': props.isMostRecentResult})}>Renamed column: </span>{getDisplayColumnHeader(oldCh)} to {getDisplayColumnHeader(newCh)} </div>
                                })}
                                {columnReconData.deleted_columns.map((ch, index) => {
                                    return <div key={dfName + 'removed' + index} className="ml-5px">Deleted column: {getDisplayColumnHeader(ch)}</div>
                                })}
                            </div>
                        )
                    })}
                    {result.deleted_dataframe_names.map(dfName => {
                        return (
                            <div key={dfName}>
                                <span>Deleted:</span> <span>{dfName}</span> 
                            </div>
                        )
                    })}
                    
                    {(result.last_line_value === undefined || result.last_line_value === null) 
                        && result.created_dataframe_names.length === 0 
                        && Object.entries(result.modified_dataframes_recons).length === 0 
                        && result.prints.length === 0
                        && result.deleted_dataframe_names.length === 0 && 
                        <p>
                            No changes
                        </p>
                    }
                </Col>
                <Col offset={.5}>
                    {(result.created_dataframe_names.length > 0 || Object.entries(result.modified_dataframes_recons).length > 0 || result.deleted_dataframe_names.length > 0) &&
                        props.isMostRecentResult &&
                        <EyeIcon 
                            variant={props.uiState.dataRecon !== undefined ? 'selected' : 'unselected'} 
                            onClick={() => {
                                props.setUIState(prevUIState => {

                                    // If the user clicks the eye when the recon is displayed, 
                                    // remove the dataRecon from the UIState so that it is not 
                                    // highlighted in the sheet anymore
                                    if (prevUIState.dataRecon !== undefined) {
                                        
                                        // We don't want to display the recon in this case, until there is a successful execution
                                        props.setDisplayRecon(false)

                                        return {
                                            ...prevUIState, 
                                            dataRecon: undefined
                                        }
                                    }

                                    // If the recon is already displayed, then display it. 
                                    const newDataRecon = {
                                        created_dataframe_names: result.created_dataframe_names,
                                        deleted_dataframe_names: result.deleted_dataframe_names,
                                        modified_dataframes_recons: result.modified_dataframes_recons
                                    } 

                                    return {
                                        ...prevUIState, 
                                        dataRecon: newDataRecon
                                    }
                                })
                            }}
                        /> 
                    }
                </Col>
            </Row>
            
            <Row justify="space-between" align="center" suppressTopBottomMargin>
                <Col>
                    <p className="text-body-2">
                        How did Mito AI Assistant do?
                    </p>
                </Col>
                <Col offsetRight={.5}>
                    <Row suppressTopBottomMargin>
                        <Col>
                            <p
                                className={classNames("ai-transformation-feedback-button", {'ai-transformation-feedback-button-selected': sentFeedback === 'Up'})}
                                onClick={() => {
                                    setSentFeedback('Up');
                                    
                                    void props.mitoAPI.log('ai_transformation_feedback', {
                                        'feedback': 'Up',
                                        ...logParams
                                    })
                                }}
                            >
                                👍
                            </p>
                        </Col>
                        <Col offset={2}>
                            <p
                                className={classNames("ai-transformation-feedback-button", {'ai-transformation-feedback-button-selected': sentFeedback === 'Down'})}
                                onClick={() => {
                                    setSentFeedback('Down')
                                    void props.mitoAPI.log('ai_transformation_feedback', {
                                        'feedback': 'Down',
                                        ...logParams
                                    })
                                }}
                            >
                                👎
                            </p>
                        </Col>
                    </Row>
                </Col>
            </Row>
            {sentFeedback !== undefined && 
                <p className="text-body-2">Thanks for the feedback - {sentFeedback === 'Down' ? "we're working hard to improve." : "we're glad things are working well!"}</p>
            }
        </div>

    )
}

export default AITransformationResultSection;
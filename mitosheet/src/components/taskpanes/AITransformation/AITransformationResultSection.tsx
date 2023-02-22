import React, { useState } from "react";
import { SheetData, UIState } from "../../../types";

import '../../../../css/taskpanes/AITransformation/AITransformation.css';
import { AITransformationResult } from "./AITransformationTaskpane";
import { getDisplayColumnHeader } from "../../../utils/columnHeaders";
import Row from "../../layout/Row";
import Col from "../../layout/Col";
import MitoAPI from "../../../jupyter/api";

interface AITransformationResultSectionProps {
    mitoAPI: MitoAPI;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    result: AITransformationResult | undefined;
    sheetDataArray: SheetData[]
}

const getFeedbackButton = (idx: number, setSentFeedback: React.Dispatch<React.SetStateAction<number>>): JSX.Element => {
    return (
        <Col 
            className="ai-transformation-feedback-button"
            onClick={() => {
                setSentFeedback(idx);
                // TODO: send the feedback to the backend!
            }}
        >{idx}</Col>
    )
}

const AITransformationResultSection = (props: AITransformationResultSectionProps): JSX.Element => {

    const [sentFeedback, setSentFeedback] = useState(-1);
    
    const result = props.result;

    if (result === undefined) {
        return <></>
    }

    return (
        <>
            {result.last_line_value !== undefined && result.last_line_value !== null && 
                <p>Value: {result.last_line_value}</p>
            }
            {result.created_dataframe_names.map(dfName => {
                const sheetIndex = props.sheetDataArray.findIndex(sd => sd.dfName === dfName);
                return (
                    <div 
                        onClick={() => {
                            props.setUIState(prevUIState => {
                                return {
                                    ...prevUIState,
                                    selectedSheetIndex: sheetIndex !== -1 ? sheetIndex : prevUIState.selectedSheetIndex
                                }
                            })
                        }}>
                            Created: <span className="text-underline">{dfName}</span> 
                        </div>
                )
            })}
            {Object.entries(result.modified_dataframes_column_recons).map(([dfName, columnReconData]) => {
                const sheetIndex = props.sheetDataArray.findIndex(sd => sd.dfName === dfName);
                return (
                    <div>
                        <div 
                            onClick={() => {
                                props.setUIState(prevUIState => {
                                    return {
                                        ...prevUIState,
                                        selectedSheetIndex: sheetIndex !== -1 ? sheetIndex : prevUIState.selectedSheetIndex
                                    }
                                })
                            }}>
                            Modified: <span className="text-underline">{dfName}</span> 
                        </div>
                        {columnReconData.added_columns.map(ch => {
                            return <div className="ml-5px">Added: {getDisplayColumnHeader(ch)}</div>
                        })}
                        {columnReconData.modified_columns.map(ch => {
                            return <div className="ml-5px">Modified: {getDisplayColumnHeader(ch)}</div>
                        })}
                        {Object.entries(columnReconData.renamed_columns).map(([oldCh, newCh]) => {
                            return <div className="ml-5px">Renamed: {getDisplayColumnHeader(oldCh)} to {getDisplayColumnHeader(newCh)} </div>
                        })}
                        {columnReconData.removed_columns.map(ch => {
                            return <div className="ml-5px">Removed: {getDisplayColumnHeader(ch)}</div>
                        })}
                    </div>
                )
            })}
            {result.deleted_dataframe_names.map(dfName => {
                return (
                    <div>
                        Deleted: <span>{dfName}</span> 
                    </div>
                )
            })}
            {!(result.last_line_value !== undefined && result.last_line_value !== null) && result.created_dataframe_names.length === 0 && Object.entries(result.modified_dataframes_column_recons).length === 0 && result.deleted_dataframe_names.length === 0 && 
                <p>
                    No changes
                </p>
            }
            <p className="mt-5px text-bold">On a scale from 1-10, how effective was Mito AI?</p>
            <Row justify="space-between">
                {Array.from(Array(10).keys()).map(idx => idx + 1 ).map(idx => {
                    return getFeedbackButton(idx, setSentFeedback)
                })}
            </Row>
            {sentFeedback >= 1 && 
                <p>Thanks for the feedback - {sentFeedback < 7 ? "we're working hard to improve." : "we're glad things are working well!"}</p>
            }
        </>

    )
}

export default AITransformationResultSection;
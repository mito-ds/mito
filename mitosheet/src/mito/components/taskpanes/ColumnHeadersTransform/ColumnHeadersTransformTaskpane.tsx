/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, SheetData, UIState, UserProfile } from "../../../types";

import TextButton from "../../elements/TextButton";
import Row from "../../layout/Row";
import DefaultEmptyTaskpane from "../DefaultTaskpane/DefaultEmptyTaskpane";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import ColumnHeadersTransformReplace from "./ColumnHeadersTransformReplace";


interface ColumnHeadersTransformTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
    sheetDataArray: SheetData[];
    selectedSheetIndex: number;
}

export interface ColumnHeadersTransformUpperCaseParams {
    sheet_index: number,
    transformation: {
        type: 'uppercase'
    }
}
export interface ColumnHeadersTransformLowerCaseParams {
    sheet_index: number,
    transformation: {
        type: 'lowercase'
    }
}

export interface ColumnHeadersTransformReplaceParams {
    sheet_index: number,
    transformation: {
        type: 'replace',
        old: string,
        new: string,
    }
}

export type ColumnHeadersTransformParams = ColumnHeadersTransformUpperCaseParams | ColumnHeadersTransformLowerCaseParams | ColumnHeadersTransformReplaceParams;

/* 
    This is the Column Headers Transform taskpane.
*/
const ColumnHeadersTransformTaskpane = (props: ColumnHeadersTransformTaskpaneProps): JSX.Element => {

    const sheetData: SheetData | undefined = props.sheetDataArray[props.selectedSheetIndex];

    if (sheetData === undefined) {
        return <DefaultEmptyTaskpane setUIState={props.setUIState}/>
    }

    const numHeaders = sheetData.data.length;
    
    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader 
                header="Column Headers Transformations"
                setUIState={props.setUIState}

            />
            <DefaultTaskpaneBody
                requiresPro={{
                    featureName: "column_headers_transform",
                    mitoAPI: props.mitoAPI
                }}
                userProfile={props.userProfile}
            >
                <Row>
                    <TextButton 
                        variant="dark"
                        onClick={() => {
                            void props.mitoAPI.editColumnHeadersTransform({
                                sheet_index: props.selectedSheetIndex,
                                transformation: {'type': 'uppercase'}
                            })
                        }}
                    >
                        Uppercase {numHeaders} Headers
                    </TextButton>                    
                </Row>
                <Row>
                    <TextButton 
                        variant="dark"
                        onClick={() => {
                            void props.mitoAPI.editColumnHeadersTransform({
                                sheet_index: props.selectedSheetIndex,
                                transformation: {'type': 'lowercase'}
                            })
                        }}
                    >
                        Lowercase {numHeaders} Headers
                    </TextButton>                  
                </Row>
                <ColumnHeadersTransformReplace
                    mitoAPI={props.mitoAPI}
                    userProfile={props.userProfile}
                    analysisData={props.analysisData}
                    selectedSheetIndex={props.selectedSheetIndex}
                    numHeaders={numHeaders}
                />
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default ColumnHeadersTransformTaskpane;
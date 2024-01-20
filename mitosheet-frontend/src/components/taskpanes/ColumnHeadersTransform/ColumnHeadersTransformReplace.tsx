import React, { useEffect } from "react";
import useSendEditOnClick from '../../../hooks/useSendEditOnClick';
import { MitoAPI } from "../../../api/api";
import { AnalysisData, StepType, UserProfile } from "../../../types";

import Input from "../../elements/Input";
import LabelAndTooltip from "../../elements/LabelAndTooltip";
import TextButton from "../../elements/TextButton";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import { ColumnHeadersTransformReplaceParams } from "./ColumnHeadersTransformTaskpane";


interface ColumnHeadersTransformReplaceProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    analysisData: AnalysisData;
    selectedSheetIndex: number;
    numHeaders: number;
}


const ColumnHeadersTransformReplace = (props: ColumnHeadersTransformReplaceProps): JSX.Element => {

    const {params, setParams, edit} = useSendEditOnClick<ColumnHeadersTransformReplaceParams, undefined>(
        () => {return {
            sheet_index: props.selectedSheetIndex,
            transformation: {'type': 'replace', 'old': '', 'new': ''},
        }},
        StepType.ColumnHeadersTransform, 
        props.mitoAPI,
        props.analysisData,
    )

    useEffect(() => {
        setParams((prevParams) => {
            if (prevParams === undefined) {
                return prevParams;
            }
            return {
                sheet_index: props.selectedSheetIndex,
                transformation: prevParams.transformation
            }
        })
    }, [props.selectedSheetIndex])

    if (params === undefined) {
        return <></>
    }
    
    return (
        <>
            <Row justify='start' align='center'>
                <Col>
                    <LabelAndTooltip tooltip="Find and replace in all string column headers.">
                        Find and Replace in Column Headers
                    </LabelAndTooltip>
                </Col>
            </Row>
            <Row justify='space-between' align='center'>
                <Col>
                    <p>
                        Find
                    </p>
                </Col>
                <Col>
                    <Input
                        value={params.transformation.type === 'replace' ? params.transformation.old : ''}
                        onChange={(e): void => {
                            const newParams = {...params};
                            newParams.transformation = {
                                'type': 'replace',
                                'old': e.target.value,
                                'new': params.transformation.type === 'replace' ? params.transformation.new : ''
                            }
                            setParams(newParams);
                        }}
                    ></Input>
                </Col>
            </Row>
            <Row justify='space-between' align='center'>
                <Col>
                    <p>
                        Replace
                    </p>
                </Col>
                <Col>
                    <Input
                        value={params.transformation.type === 'replace' ? params.transformation.new : ''}
                        onChange={(e): void => {
                            const newParams = {...params};
                            newParams.transformation = {
                                'type': 'replace',
                                'old': params.transformation.type === 'replace' ? params.transformation.old : '',
                                'new': e.target.value,
                            }
                            setParams(newParams);
                        }}
                    ></Input>
                </Col>
            </Row>
            <Row>
                <TextButton 
                    disabled={params.transformation.type !== 'replace'}
                    variant="dark"
                    onClick={() => {
                        edit();
                    }}
                >
                    Replace in {props.numHeaders} Headers
                </TextButton>                  
            </Row>
        </>
    )
}

export default ColumnHeadersTransformReplace;
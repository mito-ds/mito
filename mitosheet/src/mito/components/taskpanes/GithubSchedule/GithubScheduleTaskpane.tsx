import React, { useState } from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, UIState, UserProfile } from "../../../types";

import TextButton from "../../elements/TextButton";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";
import Input from "../../elements/Input";
import Row from "../../layout/Row";
import Col from "../../layout/Col";
import LabelAndTooltip from "../../elements/LabelAndTooltip";
import TextArea from "../../elements/TextArea";


interface GithubScheduleTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
}

type GithubScheduleParams = {
    automationName: string,
    automationDescription: string,
    schedule: any
}

const getDefaultParams = (): GithubScheduleParams => {
    return {
        automationName: '',
        automationDescription: '',
        schedule: undefined
    }
}

const GithubScheduleTaskpane = (props: GithubScheduleTaskpaneProps): JSX.Element => {

    const [params, setParams] = useState(() => getDefaultParams());
    const [loading, setLoading] = useState(false);
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header={'Schedule on Github'}
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody
                //requiresEnterprise={{
                //    'featureName': 'Github Scheduling',
                //    'mitoAPI': props.mitoAPI
                //}}
            >
                <Row justify='space-between' align='center'>
                    <Col span={14}>
                        <LabelAndTooltip tooltip="Give your automation a short, descriptive name describing what it does.">
                            Automation Name
                        </LabelAndTooltip>
                    </Col>
                    <Col>
                        <Input
                            value={params.automationName}
                            onChange={(e) => {
                                const newAutomationName = e.target.value;
                                setParams((prevParams) => {
                                    return {
                                        ...prevParams,
                                        automationName: newAutomationName,
                                    }
                                })
                            }}
                            placeholder="Automation Name"
                        />
                    </Col>
                </Row>
                <LabelAndTooltip tooltip="Describe what your automation does.">
                    Automation Description
                </LabelAndTooltip>
                <TextArea
                    value={params.automationDescription}
                    onChange={(e) => {
                        const newAutomationDescription = e.target.value;
                        setParams((prevParams) => {
                            return {
                                ...prevParams,
                                automationDescription: newAutomationDescription,
                            }
                        })
                    }}
                    placeholder="Describe what this automation accomplishes"
                    height="medium"
                
                />
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    variant='dark'
                    width='block'
                    disabled={loading}
                    onClick={async () => {
                        setLoading(true);
                        const response = await props.mitoAPI.getPRUrlOfNewPR(
                            params.automationName,
                            params.automationDescription
                        );
                        setLoading(false);
                        const url ='error' in response ? undefined : response.result;
                        console.log(response, url)
                        if (url !== undefined) {
                            // Open in a new tab
                            window.open(url, '_blank');
                        }
                    }}
                >
                    Schedule on Github
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default GithubScheduleTaskpane;
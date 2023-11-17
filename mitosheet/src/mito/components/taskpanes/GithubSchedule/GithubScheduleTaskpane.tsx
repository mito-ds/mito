import React, { useState } from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, UIState, UserProfile } from "../../../types";

import AutomationSchedule, { AutomationScheduleType } from "../../elements/AutomationSchedulePicker";
import Input from "../../elements/Input";
import LoadingDots from "../../elements/LoadingDots";
import TextArea from "../../elements/TextArea";
import TextButton from "../../elements/TextButton";
import Col from "../../layout/Col";
import Row from "../../layout/Row";
import Spacer from "../../layout/Spacer";
import DefaultTaskpane from "../DefaultTaskpane/DefaultTaskpane";
import DefaultTaskpaneBody from "../DefaultTaskpane/DefaultTaskpaneBody";
import DefaultTaskpaneFooter from "../DefaultTaskpane/DefaultTaskpaneFooter";
import DefaultTaskpaneHeader from "../DefaultTaskpane/DefaultTaskpaneHeader";


interface GithubScheduleTaskpaneProps {
    mitoAPI: MitoAPI;
    userProfile: UserProfile;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    analysisData: AnalysisData;
}

type GithubScheduleParams = {
    automationName: string,
    automationDescription: string,
    schedule: AutomationScheduleType
}

const getDefaultParams = (): GithubScheduleParams => {
    return {
        automationName: '',
        automationDescription: '',
        schedule: {
            type: 'Every Day',
            time: '08:00',
        }
    }
}

const GithubScheduleTaskpane = (props: GithubScheduleTaskpaneProps): JSX.Element => {

    const [params, setParams] = useState(() => getDefaultParams());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    const [automationURL, setAutomationURL] = useState<string | undefined>(undefined);
    
    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header={'Schedule on Github'}
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody
                userProfile={props.userProfile}
                requiresEnterprise={{
                    featureName: 'Github Scheduling',
                    mitoAPI: props.mitoAPI
                }}
            >
                <Row justify='space-between' align='center'>
                    <Col span={14}>
                        <p className='text-header-3'>
                            Automation Name
                        </p>
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
                                setAutomationURL(undefined);
                            }}
                            placeholder="Automation Name"
                        />
                    </Col>
                </Row>
                <p className='text-header-3'>
                    Automation Description
                </p>
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
                        setAutomationURL(undefined);
                    }}
                    placeholder="Describe what this automation accomplishes"
                    height="small"
                />
                <Spacer px={10}/>
                <AutomationSchedule
                    schedule={params.schedule}
                    setSchedule={(newSchedule) => {
                        setParams((prevParams) => {
                            return {
                                ...prevParams,
                                schedule: newSchedule,
                            }
                        })
                        setAutomationURL(undefined);
                    }}
                />
                {error !== undefined && 
                    <div>
                        <p className="text-color-error">
                            {error}
                        </p>
                    </div>
                }
                {automationURL !== undefined && 
                    <div>
                        <p className="text-body-1">
                            <a href={automationURL} target="_blank" className="text-body-1-link" >Click here </a> to view your automation on Github.
                        </p>
                    </div>
                }
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                {loading &&
                    <p className='text-subtext-1'>
                        Scheduling automation<LoadingDots/>
                    </p>
                }
                <TextButton
                    variant='dark'
                    width='block'
                    disabled={loading}
                    onClick={async () => {
                        if (params.automationName === '') {
                            setError('Please enter an automation name');
                            return;
                        }

                        if (params.automationDescription === '') {
                            setError('Please enter an automation description');
                            return;
                        }
                        
                        setError(undefined);
                        setLoading(true);
                        const response = await props.mitoAPI.getPRUrlOfNewPR(
                            params.automationName,
                            params.automationDescription,
                            params.schedule
                        );
                        setLoading(false);
                        const urlOrError ='error' in response ? undefined : response.result;
                        if (urlOrError !== undefined && typeof urlOrError === 'string') {
                            // Open in a new tab
                            setAutomationURL(urlOrError);
                            window.open(urlOrError, '_blank');
                        } else if (urlOrError !== undefined && typeof urlOrError === 'object') {
                            // Handle error
                            setError(urlOrError.error);
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
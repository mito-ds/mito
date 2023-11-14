import React from "react";
import { MitoAPI } from "../../../api/api";
import { AnalysisData, UIState, UserProfile } from "../../../types";

import TextButton from "../../elements/TextButton";
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

const GithubScheduleTaskpane = (props: GithubScheduleTaskpaneProps): JSX.Element => {

    return (
        <DefaultTaskpane>
            <DefaultTaskpaneHeader 
                header={'Schedule on Github'}
                setUIState={props.setUIState}           
            />
            <DefaultTaskpaneBody
                requiresEnterprise={{
                    'featureName': 'Github Scheduling',
                    'mitoAPI': props.mitoAPI
                }}
            >
            </DefaultTaskpaneBody>
            <DefaultTaskpaneFooter>
                <TextButton
                    variant='dark'
                    width='block'
                    onClick={async () => {
                        const url = await props.mitoAPI.getPRUrlOfNewPR('New Name');
                        console.log(url);
                    }}
                >
                    Schedule on Github
                </TextButton>
            </DefaultTaskpaneFooter>
        </DefaultTaskpane>
    )
}

export default GithubScheduleTaskpane;
// Copyright (c) Mito

import React, { useState } from 'react';
import DefaultTaskpane from '../DefaultTaskpane/DefaultTaskpane';
import { StepSummary, UserProfile } from '../../../types';
import { MitoAPI } from '../../../api/api';
import '../../../../../css/taskpanes/Steps/StepTaskpane.css'
import StepDataElement from './StepDataElement';
import { UIState } from '../../../types';
import DefaultTaskpaneHeader from '../DefaultTaskpane/DefaultTaskpaneHeader';
import DefaultTaskpaneBody from '../DefaultTaskpane/DefaultTaskpaneBody';


export type StepTaskpaneProps = {
    stepSummaryList: StepSummary[];
    currStepIdx: number;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI
    userProfile: UserProfile
};

/* 
    Taskpane containing a list of all the steps and allowing
    a user to interact with them
*/
function StepTaskpane(props: StepTaskpaneProps): JSX.Element {

    const [displayStepDropdown, setDisplayStepDropdown] = useState<number | undefined>(undefined)

    return (
        <DefaultTaskpane setUIState={props.setUIState} mitoAPI={props.mitoAPI}>
            <DefaultTaskpaneHeader
                header='Step History'
                setUIState={props.setUIState}
            />
            <DefaultTaskpaneBody>
                <div className='step-takspane-container'>
                    {props.stepSummaryList.map((stepSummary) => {
                        return (
                            <StepDataElement
                                key={stepSummary.step_id}
                                beforeCurrIdx={stepSummary.step_idx <= props.currStepIdx}
                                isCurrIdx={stepSummary.step_idx === props.currStepIdx}
                                lastIndex={props.stepSummaryList[props.stepSummaryList.length - 1].step_idx}
                                stepData={stepSummary}
                                mitoAPI={props.mitoAPI}
                                stepIdx={stepSummary.step_idx}
                                isPro={props.userProfile.isPro}
                                displayDropdown={displayStepDropdown===stepSummary.step_idx}
                                setDisplayDropdown={() => {
                                    setDisplayStepDropdown(prevDisplayStepDropdown => {
                                        if (prevDisplayStepDropdown === stepSummary.step_idx) {
                                            return undefined
                                        } else {
                                            return stepSummary.step_idx
                                        }
                                    })
                                }}
                            />
                        )
                    })}
                </div>
            </DefaultTaskpaneBody>
        </DefaultTaskpane>
    )
}

export default StepTaskpane;
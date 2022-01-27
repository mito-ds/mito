// Copyright (c) Mito

import React from 'react';
import DefaultTaskpane from '../DefaultTaskpane';
import { StepSummary } from '../../../types';
import MitoAPI from '../../../api';
import '../../../../css/taskpanes/Steps/StepTaskpane.css'
import StepDataElement from './StepDataElement';
import { UIState } from '../../../types';


export type StepTaskpaneProps = {
    stepSummaryList: StepSummary[];
    currStepIdx: number;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    mitoAPI: MitoAPI
};

/* 
    Taskpane containing a list of all the steps and allowing
    a user to interact with them
*/
function StepTaskpane(props: StepTaskpaneProps): JSX.Element {

    return (
        <DefaultTaskpane
            header = {'Step History'}
            setUIState={props.setUIState}
            taskpaneBody = {
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
                            />
                        )
                    })}
                </div>
            }
        />
    )
}

export default StepTaskpane;
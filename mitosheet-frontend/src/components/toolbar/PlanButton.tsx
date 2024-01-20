import React from 'react'
import { MitoAPI } from '../../api/api';
import { UIState, UserProfile } from '../../types';
import { classNames } from '../../utils/classNames';
import { TaskpaneType } from '../taskpanes/taskpanes';


interface PlanButtonProps {
    userProfile: UserProfile,
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    mitoAPI: MitoAPI
}

// The component in the toolbar that either tells you are pro or asks you to upgrade
const PlanButton = (props: PlanButtonProps): JSX.Element => {

    const disabledDueToReplayAnalysis = props.uiState.currOpenTaskpane.type === TaskpaneType.UPDATEIMPORTS && props.uiState.currOpenTaskpane.failedReplayData !== undefined;

    let displayMessage = 'Upgrade to Mito Pro';
    let proOrEnterprise: 'Pro' | 'Enterprise' = 'Pro'
    if (props.userProfile.isPro) {
        displayMessage = 'Mito Pro';
    } 
    if (props.userProfile.isEnterprise) {
        displayMessage = 'Mito Enterprise';
        proOrEnterprise = 'Enterprise'
    }

    return (
        <div 
            className={classNames('text-button', 'text-button-variant-dark', 'mito-plan-button', 'cursor-pointer')}
            onClick={() => {
                
                if (disabledDueToReplayAnalysis) {
                    return;
                }

                if (!props.userProfile.isPro) {
                    void props.mitoAPI.log('clicked_plan_button');
                }

                props.setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.UPGRADE_TO_PRO, proOrEnterprise: proOrEnterprise},
                        selectedTabType: 'data'
                    }
                })
            }}
        >
            {displayMessage}
        </div>
    )
}

export default PlanButton;
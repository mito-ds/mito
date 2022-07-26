import React from 'react'
import MitoAPI from '../../jupyter/api';
import { AnalysisData, UIState, UserProfile } from '../../types';
import { classNames } from '../../utils/classNames';
import { isVariantB } from '../../utils/experiments';
import { getRemainingChecklistItems } from '../checklists/Checklist';


interface PlanButtonProps {
    userProfile: UserProfile,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    mitoAPI: MitoAPI,
    analysisData: AnalysisData
}

/**
 * If the user is in their first usage, and they have "finished" the onboarding
 * checklist, then we allow them to reopen the checklist. 
 * 
 * This allows users to go through the onboarding checklist again, if they finish
 * it and want to do so. It also allows them to reopen the onboarding checklist
 * if they close it early but want it back.
 */
const OpenOnboardingChecklist = (props: PlanButtonProps): JSX.Element => {
    
    if (isVariantB(props.analysisData) || props.userProfile.numUsages !== 1 || getRemainingChecklistItems(props.userProfile).length !== 0) {
        return <></>;
    }

    return (
        <div 
            className={classNames('text-button', 'text-button-variant-dark', 'plan-button')}
            onClick={() => {
                // We set the checklist back to the first item
                void props.mitoAPI.updateChecklist('onboarding_checklist', ['signup'], true);

                void props.mitoAPI.log('clicked_reopen_onboarding_checklist');
            }}
        >

            Onboarding Checklist
        </div>
    )
}

export default OpenOnboardingChecklist;
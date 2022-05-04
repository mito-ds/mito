import React from 'react'
import MitoAPI from '../../jupyter/api';
import { UIState, UserProfile } from '../../types';
import { TaskpaneType } from '../taskpanes/taskpanes';


interface PlanButtonProps {
    userProfile: UserProfile,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    mitoAPI: MitoAPI
}

// TODO: this needs a better name
const PlanButton = (props: PlanButtonProps): JSX.Element => {


    return (
        <div 
            className='plan-button'
            onClick={() => {

                if (!props.userProfile.isPro) {
                    void props.mitoAPI.log('clicked_plan_button');
                }

                props.setUIState(prevUIState => {
                    return {
                        ...prevUIState,
                        currOpenTaskpane: {type: TaskpaneType.UPGRADE_TO_PRO},
                        selectedTabType: 'data'
                    }
                })
            }}
        >
            {props.userProfile.isPro ?  "Mito Pro" : "Upgrade to Mito Pro"}
        </div>
    )
}

export default PlanButton;
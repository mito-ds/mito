// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState, UserProfile } from '../../../types';
import Dropdown from '../elements/Dropdown';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarCodeDropdownProps {
    actions: Record<ActionEnum, Action>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    userProfile: UserProfile
}

/**
 * Dropdown that displays all the actions that are available for code.
 */ 
const ToolbarCodeDropdown = (props: ToolbarCodeDropdownProps): JSX.Element => {

    return (
        <>
            <Dropdown 
                display={props.uiState.currOpenToolbarDropdown === 'Code'}
                closeDropdown={() => props.setUIState((prevUIState) => {
                    // Only close this dropdown if it's actually the one that is open, to avoid race conditions
                    if (prevUIState.currOpenToolbarDropdown === 'Code') {
                        return {
                            ...prevUIState,
                            currOpenToolbarDropdown: undefined
                        }
                    }
                    return prevUIState;
                })}
                width='medium'
            >
                {makeToolbarDropdownItem(props.actions[ActionEnum.CODEOPTIONS], props.userProfile)}
                {props.userProfile.mitoConfig.MITO_CONFIG_FEATURE_DISPLAY_AI_TRANSFORMATION ?
                    makeToolbarDropdownItem(props.actions[ActionEnum.AI_TRANSFORMATION], props.userProfile)
                    : <></>
                }
                {makeToolbarDropdownItem(props.actions[ActionEnum.CODESNIPPETS], props.userProfile)}
            </Dropdown>
        </>
    );
}

export default ToolbarCodeDropdown;
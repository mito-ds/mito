// Copyright (c) Mito

import React from 'react';
import { ActionEnum, UIState, UserProfile } from '../../types';
import { Actions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarCodeDropdownProps {
    actions: Actions;
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
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.CODEOPTIONS], props.userProfile)}
                {props.userProfile.mitoConfig.MITO_CONFIG_FEATURE_DISPLAY_AI_TRANSFORMATION ?
                    makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.AI_TRANSFORMATION], props.userProfile)
                    : <></>
                }
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.CODESNIPPETS], props.userProfile)}
            </Dropdown>
        </>
    );
}

export default ToolbarCodeDropdown;
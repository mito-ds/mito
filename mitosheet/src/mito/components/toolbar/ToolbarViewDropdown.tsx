// Copyright (c) Mito

import React from 'react';
import { ActionEnum, UIState, UserProfile } from '../../types';
import { Actions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarViewDropdownProps {
    actions: Actions;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    userProfile: UserProfile
}

/**
 * Dropdown that displays the view options, which right now are just fullscreen
 * mode (but in the future might contain other options).
 */ 
const ToolbarViewDropdown = (props: ToolbarViewDropdownProps): JSX.Element => {

    return (
        <>
            <Dropdown 
                display={props.uiState.currOpenToolbarDropdown === 'View'}
                closeDropdown={() => props.setUIState((prevUIState) => {
                    // Only close this dropdown if it's actually the one that is open, to avoid race conditions
                    if (prevUIState.currOpenToolbarDropdown === 'View') {
                        return {
                            ...prevUIState,
                            currOpenToolbarDropdown: undefined
                        }
                    }
                    return prevUIState;
                })}
                width='medium'
            >
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Fullscreen], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.OpenSearch], props.userProfile)}
            </Dropdown>
        </>
    );
}

export default ToolbarViewDropdown;
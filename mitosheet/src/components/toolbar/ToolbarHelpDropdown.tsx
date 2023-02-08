// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState, UserProfile } from '../../types';
import { getSortedActions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarHelpDropdownProps {
    actions: Record<ActionEnum, Action>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    userProfile: UserProfile
}

/**
 * Dropdown that displays the help dropdown, which contains a searchable
 * list of all the functionality that Mito supports
 */ 
const ToolbarHelpDropdown = (props: ToolbarHelpDropdownProps): JSX.Element => {

    const allActions = getSortedActions(props.actions);

    return (
        <>
            <Dropdown 
                display={props.uiState.currOpenToolbarDropdown === 'Help'}
                searchable
                closeDropdown={() => props.setUIState((prevUIState) => {
                    // Only close this dropdown if it's actually the one that is open, to avoid race conditions
                    if (prevUIState.currOpenToolbarDropdown === 'Help') {
                        return {
                            ...prevUIState,
                            currOpenToolbarDropdown: undefined
                        }
                    }
                    return prevUIState;
                })}
                width='large'
            >
                {allActions.map((action) => {
                    return makeToolbarDropdownItem(action, props.userProfile)
                })}
            </Dropdown>
        </>
    );
}

export default ToolbarHelpDropdown;
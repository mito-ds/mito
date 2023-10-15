// Copyright (c) Mito

import React from 'react';
import { UIState, UserProfile } from '../../types';
import { Actions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarUserDefinedEditDropdownProps {
    actions: Actions;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    userProfile: UserProfile
}

/**
 * Dropdown that displays all the actions that are available from user defined edits
 */ 
const ToolbarUserDefinedEditsDropdown = (props: ToolbarUserDefinedEditDropdownProps): JSX.Element => {

    return (
        <>
            <Dropdown 
                display={props.uiState.currOpenToolbarDropdown === 'Custom Edits'}
                closeDropdown={() => props.setUIState((prevUIState) => {
                    // Only close this dropdown if it's actually the one that is open, to avoid race conditions
                    if (prevUIState.currOpenToolbarDropdown === 'Custom Edits') {
                        return {
                            ...prevUIState,
                            currOpenToolbarDropdown: undefined
                        }
                    }
                    return prevUIState;
                })}
                width='large'
            >
                {...props.actions.runtimeEditActionsList.map(action => makeToolbarDropdownItem(action, props.userProfile, undefined, action.tooltip))}
            </Dropdown>
        </>
    );
}

export default ToolbarUserDefinedEditsDropdown;
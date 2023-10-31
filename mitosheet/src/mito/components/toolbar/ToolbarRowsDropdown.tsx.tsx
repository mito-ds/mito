// Copyright (c) Mito

import React from 'react';
import { ActionEnum, UIState, UserProfile } from '../../types';
import { Actions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarRowsDropdownProps {
    actions: Actions;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    userProfile: UserProfile
}

/**
 * Dropdown that displays all the actions that are available for editing Rows.
 */ 
const ToolbarRowsDropdown = (props: ToolbarRowsDropdownProps): JSX.Element => {

    return (
        <>
            <Dropdown 
                display={props.uiState.currOpenToolbarDropdown === 'Rows'}
                closeDropdown={() => props.setUIState((prevUIState) => {
                    // Only close this dropdown if it's actually the one that is open, to avoid race conditions
                    if (prevUIState.currOpenToolbarDropdown === 'Rows') {
                        return {
                            ...prevUIState,
                            currOpenToolbarDropdown: undefined
                        }
                    }
                    return prevUIState;
                })}
                width='large'
            >
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Promote_Row_To_Header], props.userProfile)}
            </Dropdown>
        </>
    );
}

export default ToolbarRowsDropdown;
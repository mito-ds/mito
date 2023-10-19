// Copyright (c) Mito

import React from 'react';
import { ActionEnum, UIState, UserProfile } from '../../types';
import { Actions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarGraphsDropdownProps {
    actions: Actions;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    userProfile: UserProfile
}

/**
 * Dropdown that displays all the actions that are available for editing graphs
 */ 
const ToolbarGraphsDropdown = (props: ToolbarGraphsDropdownProps): JSX.Element => {

    return (
        <>
            <Dropdown 
                display={props.uiState.currOpenToolbarDropdown === 'Graphs'}
                closeDropdown={() => props.setUIState((prevUIState) => {
                    // Only close this dropdown if it's actually the one that is open, to avoid race conditions
                    if (prevUIState.currOpenToolbarDropdown === 'Graphs') {
                        return {
                            ...prevUIState,
                            currOpenToolbarDropdown: undefined
                        }
                    }
                    return prevUIState;
                })}
                width='medium'
            >
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Graph], props.userProfile)}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Duplicate_Graph], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Rename_Graph], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Delete_Graph], props.userProfile)}
            </Dropdown>
        </>
    );
}

export default ToolbarGraphsDropdown;
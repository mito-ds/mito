// Copyright (c) Mito

import React from 'react';
import { ActionEnum, UIState, UserProfile } from '../../types';
import { Actions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarEditDropdownProps {
    actions: Actions;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    userProfile: UserProfile
}

/**
 * Dropdown that displays all the actions that are available for general update
 * events, like undo and redo
 */ 
const ToolbarEditDropdown = (props: ToolbarEditDropdownProps): JSX.Element => {

    return (
        <>
            <Dropdown 
                display={props.uiState.currOpenToolbarDropdown === 'Edit'}
                closeDropdown={() => props.setUIState((prevUIState) => {
                    if (prevUIState.currOpenToolbarDropdown === 'Edit') {
                        return {
                            ...prevUIState,
                            currOpenToolbarDropdown: undefined
                        }
                    }
                    return prevUIState;
                })}
                width='medium'
            >
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Undo], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Redo], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Clear], props.userProfile)}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Copy], props.userProfile)}
            </Dropdown>
        </>
    );
}

export default ToolbarEditDropdown;
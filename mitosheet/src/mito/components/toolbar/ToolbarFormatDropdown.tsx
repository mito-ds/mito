// Copyright (c) Mito

import React from 'react';
import { ActionEnum, UIState, UserProfile } from '../../types';
import { Actions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarViewDropdownProps {
    actions: Actions;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    userProfile: UserProfile
}

/**
 * Dropdown that displays the format options.
 */ 
const ToolbarFormatDropdown = (props: ToolbarViewDropdownProps): JSX.Element => {

    return (
        <>
            <Dropdown 
                display={props.uiState.currOpenToolbarDropdown === 'Format'}
                closeDropdown={() => props.setUIState((prevUIState) => {
                    // Only close this dropdown if it's actually the one that is open, to avoid race conditions
                    if (prevUIState.currOpenToolbarDropdown === 'Format') {
                        return {
                            ...prevUIState,
                            currOpenToolbarDropdown: undefined
                        }
                    }
                    return prevUIState;
                })}
                width='large'
            >
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Set_Dataframe_Format], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Conditional_Formatting], props.userProfile)}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Format_Number_Columns], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Precision_Decrease], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Precision_Increase], props.userProfile)}
            </Dropdown>
        </>
    );
}

export default ToolbarFormatDropdown;
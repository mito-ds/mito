// Copyright (c) Mito

import React from 'react';
import { ActionEnum, UIState, UserProfile } from '../../types';
import { Actions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarColumnsDropdownProps {
    actions: Actions;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    userProfile: UserProfile;
}

/**
 * Dropdown that displays all the actions that are available for editing columns.
 */ 
const ToolbarColumnsDropdown = (props: ToolbarColumnsDropdownProps): JSX.Element => {

    return (
        <>
            <Dropdown 
                display={props.uiState.currOpenToolbarDropdown === 'Columns'}
                closeDropdown={() => props.setUIState((prevUIState) => {
                    // Only close this dropdown if it's actually the one that is open, to avoid race conditions
                    if (prevUIState.currOpenToolbarDropdown === 'Columns') {
                        return {
                            ...prevUIState,
                            currOpenToolbarDropdown: undefined
                        }
                    } else {
                        return prevUIState;
                    }
                })}

                width='large'
            >
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Add_Column], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Rename_Column], props.userProfile, true)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Delete], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.COLUMN_HEADERS_TRANSFORM], props.userProfile)}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Set_Column_Formula], props.userProfile, true)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Set_Cell_Value], props.userProfile, true)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Split_Text_To_Column], props.userProfile)}
                {props.userProfile.isPro ?
                    makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.One_Hot_Encoding], props.userProfile)
                    : <></>
                }
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Format_Number_Columns], props.userProfile)}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Filter], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Sort], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Change_Dtype], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Fill_Na], props.userProfile)}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Unique_Values], props.userProfile)}
                {makeToolbarDropdownItem(props.actions.buildTimeActions[ActionEnum.Column_Summary], props.userProfile)}
            </Dropdown>
        </>
    );
}

export default ToolbarColumnsDropdown;
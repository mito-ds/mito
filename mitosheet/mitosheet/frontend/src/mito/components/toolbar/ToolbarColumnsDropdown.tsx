// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState, UserProfile } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarColumnsDropdownProps {
    actions: Record<ActionEnum, Action>;
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
                {makeToolbarDropdownItem(props.actions[ActionEnum.Add_Column])}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Rename_Column], true)}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Delete_Column])}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions[ActionEnum.Set_Column_Formula], true)}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Set_Cell_Value], true)}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Split_Text_To_Column])}
                {props.userProfile.isPro ?
                    makeToolbarDropdownItem(props.actions[ActionEnum.One_Hot_Encoding])
                    : <></>
                }
                {makeToolbarDropdownItem(props.actions[ActionEnum.Format_Number_Columns])}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions[ActionEnum.Filter])}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Sort])}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Change_Dtype])}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Fill_Na])}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions[ActionEnum.Unique_Values])}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Column_Summary])}
            </Dropdown>
        </>
    );
}

export default ToolbarColumnsDropdown;
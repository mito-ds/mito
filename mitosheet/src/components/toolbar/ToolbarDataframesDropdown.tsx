// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState, UserProfile } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarDataframesDropdownProps {
    actions: Record<ActionEnum, Action>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
    userProfile: UserProfile
}

/**
 * Dropdown that displays all the actions that are available for editing dataframes.
 */ 
const ToolbarDataframesDropdown = (props: ToolbarDataframesDropdownProps): JSX.Element => {

    return (
        <>
            <Dropdown 
                display={props.uiState.currOpenToolbarDropdown === 'Dataframes'}
                closeDropdown={() => props.setUIState((prevUIState) => {
                    // Only close this dropdown if it's actually the one that is open, to avoid race conditions
                    if (prevUIState.currOpenToolbarDropdown === 'Dataframes') {
                        return {
                            ...prevUIState,
                            currOpenToolbarDropdown: undefined
                        }
                    }
                    return prevUIState;
                })}
                width='large'
            >
                {makeToolbarDropdownItem(props.actions[ActionEnum.Import_Files], props.userProfile)}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Dataframe_Import], props.userProfile)}
                {props.userProfile.mitoConfig.MITO_CONFIG_FEATURE_DISPLAY_SNOWFLAKE_IMPORT ?
                    makeToolbarDropdownItem(props.actions[ActionEnum.SNOWFLAKEIMPORT], props.userProfile)
                    : <></>
                }
                {makeToolbarDropdownItem(props.actions[ActionEnum.UPDATEIMPORTS], props.userProfile)}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions[ActionEnum.Export], props.userProfile)}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions[ActionEnum.Pivot], props.userProfile)}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Melt], props.userProfile)}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Drop_Duplicates], props.userProfile)}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Merge], props.userProfile)}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Concat_Dataframes], props.userProfile)}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Transpose], props.userProfile)}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions[ActionEnum.Duplicate_Dataframe], props.userProfile)}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Rename_Dataframe], props.userProfile, true)}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Delete_Dataframe], props.userProfile)}
            </Dropdown>
        </>
    );
}

export default ToolbarDataframesDropdown;
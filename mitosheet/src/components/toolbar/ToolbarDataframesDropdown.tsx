// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarDataframesDropdownProps {
    actions: Record<ActionEnum, Action>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
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
                {makeToolbarDropdownItem(props.actions[ActionEnum.Import])}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Export])}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions[ActionEnum.Duplicate_Dataframe])}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Rename_Dataframe], true)}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Delete_Dataframe])}
                <DropdownSectionSeperator isDropdownSectionSeperator/>
                {makeToolbarDropdownItem(props.actions[ActionEnum.Pivot])}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Melt])}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Drop_Duplicates])}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Merge])}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Concat_Dataframes])}
                {makeToolbarDropdownItem(props.actions[ActionEnum.Transpose])}
            </Dropdown>
        </>
    );
}

export default ToolbarDataframesDropdown;
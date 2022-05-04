// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import { makeToolbarDropdownItem } from './ToolbarDropdownItem';


interface ToolbarDataframesDropdownProps {
    actions: Record<ActionEnum, Action>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
}

/**
 * TODO
 */ 
const ToolbarDataframesDropdown = (props: ToolbarDataframesDropdownProps): JSX.Element => {

    return (
        <>
            {props.uiState.currOpenToolbarDropdown === 'Dataframes' &&
                <Dropdown 
                    closeDropdown={() => props.setUIState((prevUIState) => {
                        // TODO: explain how this avoids race conditions
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
                    {/* TODO: add a line here */}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Delete_Dataframe])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Duplicate_Dataframe])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Rename_Dataframe])}
                    {/* TODO: add a line here */}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Drop_Duplicates])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Pivot])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Merge])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Concat_Sheets])}
                </Dropdown>
            }
        </>
    );
}

export default ToolbarDataframesDropdown;
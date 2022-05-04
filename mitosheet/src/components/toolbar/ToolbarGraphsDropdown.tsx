// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarGraphsDropdownProps {
    actions: Record<ActionEnum, Action>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
}

/**
 * Dropdown that displays all the actions that are available for editing graphs
 */ 
const ToolbarGraphsDropdown = (props: ToolbarGraphsDropdownProps): JSX.Element => {

    return (
        <>
            {props.uiState.currOpenToolbarDropdown === 'Graphs' &&
                <Dropdown 
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
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Graph])}
                    <DropdownSectionSeperator isDropdownSectionSeperator/>
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Duplicate_Graph])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Rename_Graph])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Delete_Graph])}
                </Dropdown>
            }
        </>
    );
}

export default ToolbarGraphsDropdown;
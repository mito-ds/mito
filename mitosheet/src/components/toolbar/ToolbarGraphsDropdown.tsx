// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import DropdownSectionSeperator from '../elements/DropdownSectionSeperator';
import {makeToolbarDropdownItem} from './ToolbarDropdownItem';


interface ToolbarGraphsDropdownProps {
    actions: Record<ActionEnum, Action>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
}

/**
 * TODO
 */ 
const ToolbarGraphsDropdown = (props: ToolbarGraphsDropdownProps): JSX.Element => {

    return (
        <>
            {props.uiState.currOpenToolbarDropdown === 'Graphs' &&
                <Dropdown 
                    closeDropdown={() => props.setUIState((prevUIState) => {
                        // TODO: explain how this avoids race conditions
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
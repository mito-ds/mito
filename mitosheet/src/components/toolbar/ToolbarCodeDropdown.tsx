// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarCodeDropdownProps {
    actions: Record<ActionEnum, Action>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
}

/**
 * Dropdown that displays all the actions that are available for code.
 */ 
const ToolbarCodeDropdown = (props: ToolbarCodeDropdownProps): JSX.Element => {

    return (
        <>
            <Dropdown 
                display={props.uiState.currOpenToolbarDropdown === 'Code'}
                closeDropdown={() => props.setUIState((prevUIState) => {
                    // Only close this dropdown if it's actually the one that is open, to avoid race conditions
                    if (prevUIState.currOpenToolbarDropdown === 'Code') {
                        return {
                            ...prevUIState,
                            currOpenToolbarDropdown: undefined
                        }
                    }
                    return prevUIState;
                })}
                width='medium'
            >
                {makeToolbarDropdownItem(props.actions[ActionEnum.CODESNIPPETS])}
            </Dropdown>
        </>
    );
}

export default ToolbarCodeDropdown;
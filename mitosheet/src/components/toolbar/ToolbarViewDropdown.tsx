// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarViewDropdownProps {
    actions: Record<ActionEnum, Action>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
}

/**
 * Dropdown that displays the view options, which right now are just fullscreen
 * mode (but in the future might contain other options).
 */ 
const ToolbarViewDropdown = (props: ToolbarViewDropdownProps): JSX.Element => {

    return (
        <>
            {props.uiState.currOpenToolbarDropdown === 'View' &&
                <Dropdown 
                    closeDropdown={() => props.setUIState((prevUIState) => {
                        // Only close this dropdown if it's actually the one that is open, to avoid race conditions
                        if (prevUIState.currOpenToolbarDropdown === 'View') {
                            return {
                                ...prevUIState,
                                currOpenToolbarDropdown: undefined
                            }
                        }
                        return prevUIState;
                    })}
                    width='medium'
                >
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Fullscreen])}
                </Dropdown>
            }
        </>
    );
}

export default ToolbarViewDropdown;
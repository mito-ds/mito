// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import { makeToolbarDropdownItem } from './ToolbarDropdownItem';


interface ToolbarViewDropdownProps {
    actions: Record<ActionEnum, Action>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
}

/**
 * TODO
 */ 
const ToolbarViewDropdown = (props: ToolbarViewDropdownProps): JSX.Element => {

    return (
        <>
            {props.uiState.currOpenToolbarDropdown === 'View' &&
                <Dropdown 
                    closeDropdown={() => props.setUIState((prevUIState) => {
                        // TODO: explain how this avoids race conditions
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
// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import { makeToolbarDropdownItem } from './ToolbarDropdownItem';


interface ToolbarEditDropdownProps {
    actions: Record<ActionEnum, Action>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
}

/**
 * The ToolbarButton component is used to create each
 * button in the Toolbar. 
 */ 
const ToolbarEditDropdown = (props: ToolbarEditDropdownProps): JSX.Element => {

    return (
        <>
            {props.uiState.currOpenToolbarDropdown === 'Edit' &&
                <Dropdown 
                    closeDropdown={() => props.setUIState((prevUIState) => {
                        if (prevUIState.currOpenToolbarDropdown === 'Edit') {
                            return {
                                ...prevUIState,
                                currOpenToolbarDropdown: undefined
                            }
                        }
                        return prevUIState;
                    })}
                    width='medium'
                >
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Undo])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Redo])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Clear])}
                </Dropdown>
            }
        </>
    );
}

export default ToolbarEditDropdown;
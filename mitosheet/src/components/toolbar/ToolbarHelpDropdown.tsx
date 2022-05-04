// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState } from '../../types';
import { getSortedActions } from '../../utils/actions';
import Dropdown from '../elements/Dropdown';
import { makeToolbarDropdownItem } from './utils';


interface ToolbarHelpDropdownProps {
    actions: Record<ActionEnum, Action>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
}

/**
 * Dropdown that displays the help dropdown, which contains a searchable
 * list of all the functionality that Mito supports
 */ 
const ToolbarHelpDropdown = (props: ToolbarHelpDropdownProps): JSX.Element => {

    const allActions = getSortedActions(props.actions);

    return (
        <>
            {props.uiState.currOpenToolbarDropdown === 'Help' &&
                <Dropdown 
                    searchable
                    closeDropdown={() => props.setUIState((prevUIState) => {
                        // TODO: explain how this avoids race conditions
                        if (prevUIState.currOpenToolbarDropdown === 'Help') {
                            return {
                                ...prevUIState,
                                currOpenToolbarDropdown: undefined
                            }
                        }
                        return prevUIState;
                    })}
                    width='large'
                >
                    {allActions.map((action, idx) => {
                        return makeToolbarDropdownItem(action)
                    })}
                </Dropdown>
            }
        </>
    );
}

export default ToolbarHelpDropdown;
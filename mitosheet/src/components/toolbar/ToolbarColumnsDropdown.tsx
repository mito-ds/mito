// Copyright (c) Mito

import React from 'react';
import { Action, ActionEnum, UIState } from '../../types';
import Dropdown from '../elements/Dropdown';
import { makeToolbarDropdownItem } from './ToolbarDropdownItem';


interface ToolbarColumnsDropdownProps {
    actions: Record<ActionEnum, Action>;
    uiState: UIState;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>
}

/**
 * TODO
 */ 
const ToolbarColumnsDropdown = (props: ToolbarColumnsDropdownProps): JSX.Element => {

    return (
        <>
            {props.uiState.currOpenToolbarDropdown === 'Columns' &&
                <Dropdown 
                    closeDropdown={() => props.setUIState((prevUIState) => {
                        // TODO: explain how this avoids race conditions
                        if (prevUIState.currOpenToolbarDropdown === 'Columns') {
                            return {
                                ...prevUIState,
                                currOpenToolbarDropdown: undefined
                            }
                        }
                        return prevUIState;
                    })}
                    width='large'
                >
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Add_Column])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Rename_Column])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Delete_Column])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Set_Column_Formula])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Set_Cell_Value])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Format])}
                    {/* TODO: add a line here */}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Filter])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Sort])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Change_Dtype])}
                    {/* TODO: add a line here */}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Unique_Values])}
                    {makeToolbarDropdownItem(props.actions[ActionEnum.Column_Summary])}
                </Dropdown>
            }
        </>
    );
}

export default ToolbarColumnsDropdown;
import React from 'react'
import { ToolbarDropdowns, UIState } from '../../types';
import { classNames } from '../../utils/classNames';


interface ToolbarDropdownSelectorProps {
    type: ToolbarDropdowns,
    uiState: UIState,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    children: JSX.Element
}

/**
 * A wrapper component around the selectors that create dropdowns in the toolbar
 * that allows the user to see all the editing options Mito supports.
 * 
 * If one of these dropdowns is open and you mouse over a different dropdown, it will
 * switch to that new one.
 */
const ToolbarDropdownSelector = (props: ToolbarDropdownSelectorProps): JSX.Element => {

    const selected = props.uiState.currOpenToolbarDropdown === props.type;

    return (
        <div>
            <p 
                className={classNames('mito-toolbar-dropdown-selector', 'text-unselectable', {'mito-toolbar-dropdown-selector-selected': selected})}
                onClick={() => {
                    props.setUIState(prevUIState => {
                        return {...prevUIState, currOpenToolbarDropdown: props.type}
                    })
                }}
                onMouseEnter={() => {
                    props.setUIState(prevUIState => {
                        if (prevUIState.currOpenToolbarDropdown !== undefined && !selected) {
                            return {...prevUIState, currOpenToolbarDropdown: props.type}
                        }
                        return prevUIState;
                    })
                }}
            >
                {props.type}
            </p>
            {props.children}
        </div>
    );
}

export default ToolbarDropdownSelector;
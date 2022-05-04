import React from 'react'
import { ToolbarDropdowns, UIState } from '../../types';
import { classNames } from '../../utils/classNames';


interface ToolbarMenuProps {
    type: ToolbarDropdowns,
    uiState: UIState,
    setUIState: React.Dispatch<React.SetStateAction<UIState>>,
    children: JSX.Element
}

// TODO: this needs a better name
const ToolbarMenu = (props: ToolbarMenuProps): JSX.Element => {

    const selected = props.uiState.currOpenToolbarDropdown === props.type;

    return (
        <div>
            <p 
                className={classNames('toolbar-top-menu-selector', {'toolbar-top-menu-selector-selected': selected})}
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

export default ToolbarMenu;
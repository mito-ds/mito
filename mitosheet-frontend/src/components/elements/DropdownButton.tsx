// Copyright (c) Saga Inc.
import React, { useState } from 'react';

import Dropdown from './Dropdown';
import SelectDropdownIcon from '../icons/SelectDropdownIcon';
import { classNames } from '../../utils/classNames';

// import css
import '../../../css/elements/DropdownButton.css';
import { Width } from './sizes.d';


interface DropdownButtonProps {
    /** 
        * @param children - DropdownItem(s) to be displayed in this dropdown
    */
    children: JSX.Element | JSX.Element[];
    /** 
        * @param text - Button text to be displayed
    */
    text: string;
    /** 
        * @param [value] - The width of the Select. Defaults to block.
    */
    width?: Width;
    /** 
        * @param [value] - The width of the dropdown that this button spawns. Defaults to large
    */
    dropdownWidth?: 'small' | 'medium' | 'large';
    /** 
        * @param [disabled] - Disables the dropdown button, which stops the users from clicking it
    */
    disabled?: boolean;
    /** 
        * @param [title] - The hover to display
    */
    title?: string;
    /**
        * @param [searchable] - When True, a search input field is displayed. Defaults to False
     */
    searchable?: boolean
}

/**
 * The Dropdown Button component, which allows a user to select
 * an option from a list of items (while the displayed text on
 * the button stays static).
 * 
 * If open, the select dropdown automatically closes when the user clicks.
 */ 
const DropdownButton = (props: DropdownButtonProps): JSX.Element => {
    const [displayDropdown, setDisplayDropdown] = useState(false)

    const width = props.width || 'block'

    const widthClass = `element-width-${width}`
    const disabledClass = props.disabled ? 'mito-dropdown-button-disabled' : 'mito-dropdown-button-enabled';

    return (
        <div 
            className={classNames('mito-dropdown-button', 'text-header-4', widthClass, disabledClass)}
            onClick={() => {
                setDisplayDropdown((prevDisplayDropdown) => {
                    /* 
                        Only change the visibility of the dropdown if:
                        1) the button is not disabled AND
                        2) the button is not already open because the dropdown handles closing itself
                    */ 
                    if (!props.disabled && !prevDisplayDropdown) {
                        return true;
                    }
                    return prevDisplayDropdown;
                })
            }}
        >
            <p className='mito-dropdown-button-text' title={props.title}>
                {props.text}
            </p>
            <div className='mito-dropdown-button-icon-container'>
                <SelectDropdownIcon variant='dropdown button' disabled={props.disabled}/>
            </div>
            <Dropdown
                display={displayDropdown}
                closeDropdown={() => setDisplayDropdown(false)}
                searchable={props.searchable}
                width={props.dropdownWidth}
            >
                {props.children}
            </Dropdown>
        </div>

    )
} 

export default DropdownButton;
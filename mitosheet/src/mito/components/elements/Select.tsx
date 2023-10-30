// Copyright (c) Mito
import React, { useState } from 'react';

import Dropdown from './Dropdown';
//import { getWidthAsNumber, Width } from './sizes.d';
import SelectDropdownIcon from '../icons/SelectDropdownIcon';
import { classNames } from '../../utils/classNames';


// import css
import '../../../../css/elements/Select.css';
import '../../../../css/elements/Dropdown.css';
import { Width } from './sizes.d';


interface SelectProps {
    /** 
        * @param value - The selected value of the select. It is displayed in the select resting state.
    */
    value: string;
    /** 
        * @param children - The DropdownItem(s) that the user can select from. If the title is
        * not what is stored, then the id of these DropdownItems should be set.
    */
    children: JSX.Element | JSX.Element[];
    /** 
        * @param onChange - The callback function used to set the option when selected.
    */
    onChange?: (newValue: string) => void;
    /** 
        * @param [value] - The width of the Select. Defaults to block.
    */
    width?: Width;
    /** 
        * @param [dropdownWidth] - The width of the dropdown. Defaults to 'large'
    */
    dropdownWidth?: 'small' | 'medium' | 'large';
    /**
        * @param [searchable] - When True, a search input field is displayed. Defaults to False
    */
    searchable?: boolean
    /**
        * @param [disabled] - When True, the select is disabled 
     */
    disabled?: boolean

    /**
        * @param [className] - Optional classes to apply to select 
    */
    className?: string

    /**
     * Custom styles to add to the component
     */
    style?: React.CSSProperties

    /**
     * Custom styles for the icon 
     */ 
    iconStyle?: React.CSSProperties
}

/**
 * The Select component. If open, the select dropdown automatically 
 * closes when the user clicks.
 */ 
const Select = (props: SelectProps): JSX.Element => {
    const [displayDropdown, setDisplayDropdown] = useState(false)

    const width = props.width || 'block'

    const widthClass = `element-width-${width}`
    const dropdownActiveClass = displayDropdown ? 'select-dropdown-active' : ''

    const providedClasses = props.className || ''

    /* 
        To get the value to display, we first see if any of the dropdown items
        have ids, and then take the title of the id that matches the value.

        If not, we just display the value that is passed.
    */
    let displayValue: string | undefined = props.value;

    const children = React.Children.map((props.children), (child) => {
        const {id, title}: {id: string, title: string} = child.props;

        // If an id is provided, we set that as the value, and otherwise we use the title
        if (id === props.value) {
            displayValue = title;
        }

        // If ids are given, we also use them as the value that we call with the onChange 
        // with - allowing you to store a different value than you display
        const valueForOnChange = id !== undefined ? id : title;

        /* 
            If onChange function was provided, set it as the onClick property of the child
            Sometimes the onChange is not provided to the select because its handled by the DropdownItems themselves. 

            In particular, we do this when the dropdownItem that is selected is not easily identifiable by a single string
            because selects return a string identifier for what was selected.  
        */
        const onChangeFunc = props.onChange
        if (onChangeFunc === undefined) {
            return child
        } else {
            const finalChild = React.cloneElement(child, {
                onClick: () => {
                    onChangeFunc(valueForOnChange)
                }
            })
            return finalChild;
        }        
    })

    return (
        <div 
            className={classNames('select-container', 'text-body-2', widthClass, dropdownActiveClass, providedClasses, {'select-disabled': props.disabled})}
            style={props.style}
            onClick={() => {
                // If the select is disabled, then don't do anything
                if (props.disabled) {
                    return;
                }
                setDisplayDropdown((prevDisplayDropdown) => {
                    /* 
                        Only change the visibility of the dropdown if the button is 
                        not already open because the dropdown handles closing itself
                    */ 
                    if (!prevDisplayDropdown) {
                        return true;
                    }
                    return prevDisplayDropdown;
                })
            }}
        >
            <p className='select-text'>
                {displayValue}
            </p>
            <div className='select-dropdown-icon-container' style={props.iconStyle}>
                <SelectDropdownIcon variant='select'/>
            </div>
            <Dropdown
                display={displayDropdown}
                closeDropdown={() => setDisplayDropdown(false)}
                searchable={props.searchable}
                width={props.dropdownWidth}
            >
                {children}
            </Dropdown>
        </div>
    )
} 

export default Select;
// Copyright (c) Mito
import React from 'react';

import dropdownItemStyles from './DropdownItem.module.css'

interface DropdownItemProps {
    /** 
        * @param id - If the dropdown item is used in a select, and you want to display something
        * other than what you actually store (e.g. display a columnHeader but store a columnID), 
        * then set the ID equal to the value that you want to store, and it will be used for the
        * onChange value in the select.
    */
    id?: string;

    /** 
        * @param title - The main text to be displayed. Should describe the action that pressing this DropdownItem takes
    */
    title: string;

    /** 
        * @param [subtext] - Additional text to display in the DropdownItem
    */
    subtext?: string;

    /** 
        * @param [icon] - Icon to be displayed to the left of the title
    */
    icon?: JSX.Element;

    /** 
        * @param [onClick] - Action to occur when the DropdownItem is clicked
    */
    onClick?: (e?: React.MouseEvent) => void;
}

/**
 * The DropdownItem component is used to populate the Dropdown component. 
 */ 
const DropdownItem = (props: DropdownItemProps): JSX.Element => {
    
    return (
        <div 
            className={dropdownItemStyles.dropdown_item}
            onClick={props.onClick} 
        > 
            <div className={dropdownItemStyles.dropdown_item_icon_and_title_container}>
                
                <div className={dropdownItemStyles.dropdown_item_icon_container}>
                    {props.icon}
                </div>
                {/* 
                    Wrap in a span so that hovering over the HTML element shows the entire 
                    title, in case it is cut off
                */}
                <span title={props.title}>
                    <p>
                        {props.title}
                    </p>
                </span>
            </div>
            {props.subtext &&
                /* 
                    If hideSubtext is true, then we only want to display the subtext if displaySubtextOnHover is true and the
                    DropdownItem is hovered over
                */
                <div className={dropdownItemStyles.dropdown_item_subtext_container}>
                    {props.subtext}
                </div>
            }
        </div>
    )
} 

export default DropdownItem;
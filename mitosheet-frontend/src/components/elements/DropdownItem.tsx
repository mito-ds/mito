// Copyright (c) Mito
import React from 'react';

import '../../../css/elements/DropdownItem.css'
import { classNames } from '../../utils/classNames';
import { DROPDOWN_IGNORE_CLICK_CLASS, DROPDOWN_SUPRESS_FOCUS_ON_CLOSE } from './Dropdown';

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
        * @param rightText - Optional, grey right text to be displayed in the dropdown
    */
    rightText?: string;

    /** 
        * @param [tooltip] - Optional tooltips to display (if you don't want subtext). NOTE: if this is passed
        * then the title will not be displayed as a tooltip (and so overflowing text will be invisible in this
        * case).
    */
    tooltip?: string;

    /** 
        * @param [subtext] - Additional text to display in the DropdownItem
    */
    subtext?: string;

    /**
        * @param [hideSubtext] - Hide the subtext unless overwritten by displaySubtextOnHover. We have this variable
        so that we can pass the subtext which is needed if we're going to display it when the element is selected (which 
        we do in the ActionSearchBar), but we don't want it displayed otherwise, unless displaySubtextOnHover is True and 
        the DropdownItem is being hovered over.
     */
    hideSubtext?: boolean

    /**
        * @param [displaySubtextOnHover] - Display the subtext if it exists, when hovered on
     */
    displaySubtextOnHover?: boolean

    /** 
        * @param [icon] - Icon to be displayed to the left of the title
    */
    icon?: JSX.Element;

    /** 
        * @param [onClick] - Action to occur when the DropdownItem is clicked
    */
    onClick?: (e?: React.MouseEvent) => void;

    /** 
        * @param [disabled] - Make the DropdownItem unclickable. Defaults to false
    */
    disabled?: boolean;

    /** 
        * @param className - Optional classes to add to the dropdown
    */
    className?: string;

    /**
        * @param [supressFocusSettingOnClose] - When True, the dropdown does not set the focus on the parent div
        * when this is clicked on. Helpful for items that open inputs
    */
    supressFocusSettingOnClose?: boolean
}

/**
 * The DropdownItem component is used to populate the Dropdown component. 
 */ 
const DropdownItem = (props: DropdownItemProps): JSX.Element => {

    const disabled = props.disabled === true  
    const hideSubtext = props.hideSubtext === true
    const displaySubtextOnHover = props.displaySubtextOnHover === true
    
    return (
        <div 
            className={classNames('mito-dropdown-item', {[DROPDOWN_IGNORE_CLICK_CLASS]: disabled, [DROPDOWN_SUPRESS_FOCUS_ON_CLOSE]: props.supressFocusSettingOnClose}, props.className)}
            onClick={!disabled ? props.onClick : undefined} 
            title={props.tooltip}
        > 
            <div className={classNames('mito-dropdown-item-icon-and-title-container')}>
                { props.icon !== undefined &&
                <div className={classNames('mito-dropdown-item-icon-container')}>
                    {props.icon}
                </div>}
                <div className='mito-dropdown-item-title-and-shortcut-container'>
                    {/* 
                        Wrap in a span so that hovering over the HTML element shows the entire 
                        title, in case it is cut off
                    */}
                    <span title={props.tooltip || props.title}>
                        <p className={classNames('text-body-2', 'text-overflow-hide', 'cursor-default', {'text-color-disabled': disabled})}>
                            {props.title}
                        </p>
                    </span>
                    {props.rightText &&
                        <span className={classNames('mito-dropdown-item-right-text', 'text-body-2')}>
                            {props.rightText}
                        </span>
                    }
                </div>
            </div>
            {props.subtext &&
                /* 
                    If hideSubtext is true, then we only want to display the subtext if displaySubtextOnHover is true and the
                    DropdownItem is hovered over
                */
                <div className={classNames(
                    'mito-dropdown-item-subtext-container', 
                    'text-subtext-1', 
                    {'mito-dropdown-item-subtext-disabled': disabled},
                    {'mito-dropdown-item-display-subtext-on-hover': hideSubtext && displaySubtextOnHover}
                )}>
                    {props.subtext}
                </div>
            }
        </div>
    )
} 

export default DropdownItem;
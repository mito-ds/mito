// Copyright (c) Mito
import React from 'react';

import '../../../../css/elements/TextButton.css'
import { classNames } from '../../utils/classNames';
import { Width } from './sizes.d';


interface TextButtonProps {
    /** 
        * @param children - Text to be displayed inside the button
    */
    children: string | React.ReactNode;

    /** 
        * @param variant - Color style of the button
    */
    variant: 'light' | 'dark' | 'default';

    /** 
        * @param [onClick] - Function to be called when button is pressed
    */
    onClick?: (e?: React.MouseEvent) => void;

    /** 
        * @param [disabled] - When true, the button is not clickable. Defaults to false.
    */
    disabled?: boolean;

    /** 
        * @param [width] - width of the button. Defaults to block, which grows to fill the parent container.
    */
    width?: Width;

    /** 
        * @param [type] - HTML type attribute to apply to the button. Should not be used when also supplying an href 
    */
    type?: 'button' | 'submit' | 'reset';

    /** 
        * @param [autoFocus] - When true, the button automatically gets focused on. Defaults to False.
    */
    autoFocus?: boolean;

    /** 
        * @param [href] - When supplied, the TextButton is rendered as an anchor tag.  
    */
    href?: string;

    /** 
        * @param [download] - When supplied along with the href param, the download param is the target location to download the href attribute.
    */
    download?: string;

    /** 
        * @param [target] - When supplied along with the href param, opens the link in a new window.
    */
    target?: '_blank';

    /**
        * @param [className] - Additional class to apply to the TextButton 
    */
    className?: string

    /**
        * @param [tooltip] -- Message to display as tooltip on button. Has lower priority than the disabledTooltip
    */
    tooltip?: string
    /**
        * @param [disabledTooltip] -- Message to display as tooltip when button is disabled 
    */
    disabledTooltip?: string;

    style?: React.CSSProperties;
}

/**
 * 
 * The TextButton component is a rectangular, colored button that contains centered text. 
 * 
 * By default, it relies on the HTML button, but if the href param is supplied, it will use
 * the anchor tag instead. 
 * 
 */ 
const TextButton = (props: TextButtonProps): JSX.Element => {

    // Create better default values to handle optional params 
    const disabled = props.disabled === true
    const width = props.width || 'block'
    const className = props.className || ''

    // Create css classes to apply
    const disabledClass = disabled ? 'text-button-disabled' : ''
    const widthClass = `element-width-${width}`
    const variantClass = `text-button-variant-${props.variant}`

    const disabledTooltip = props.disabled && (props.disabledTooltip !== undefined) ? props.disabledTooltip : undefined;
    // Note: the disabled tooltip has higher priority than the tooltip
    // TODO: change the interface to just make the person set the tooltip manually? 
    const tooltip = disabledTooltip !== undefined ? disabledTooltip : props.tooltip;

    if (props.href !== undefined) {
        return (
            <a 
                className={classNames('text-button', widthClass, variantClass, disabledClass, className)}
                /*  
                    Because anchor tags don't handle the disabled keyword, we check that the element
                    is not disabled before taking any action.
                */
                href={disabled ? undefined : props.href}
                download={disabled ? undefined : props.download}
                onClick={disabled ? () => {return} : props.onClick}
                target={props.target}
                title={tooltip}
            >
                <span
                    className={classNames({'text-color-background-important': props.variant === 'dark'}, 'text-overflow-wrap')}
                >
                    {props.children}
                </span>
            </a>
        )
    } else {
        return (
            <button 
                className={classNames('text-button', widthClass, variantClass, disabledClass, className)}
                onClick={props.onClick} 
                type={props.type}
                disabled={props.disabled}
                autoFocus={props.autoFocus}
                title={tooltip}
                style={props.style}
            >
                {props.children}
            </button>
        )
    }
} 

export default TextButton;
/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito
import React from 'react';

import '../../../../css/elements/TextArea.css'
import { classNames } from '../../utils/classNames';
import { Height, Width } from './sizes.d';

/**
 * The TextArea component is a rectangular text input that takes allows
 * for multiple lines of text. 
 */ 

const TextArea = (props: {
    /** 
        * @param value - The text to display inside the TextArea. This should not be used as placeholder text.
    */
    value: string;
    
    /** 
        * @param onChange - Function to be called when the input text is changed
    */
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;

    /** 
        * @param [placeholder] - Text to be displayed when there is no input.
    */
    placeholder?: string;

    /** 
        * @param [height] - Height of the button. Defaults to block, which grows to fill the parent container
    */
    height?: Height;

    /** 
        * @param [width] - Width of the button. Defaults to block, which grows to fill the parent container
    */
    width?: Width;

    /** 
        * @param [required] - When true, forces the user to input text in the TextArea before submitting, but must be used inside a form to work. Defaults to False.
    */
    required?: boolean;

    /** 
        * @param [disabled] - When true, does't let the user select the text input or type in it
    */
    disabled?: boolean;

    /** 
        * @param [autoFocus] - When true, the button automatically gets focused on. Defaults to False.
    */
    autoFocus?: boolean;

    /** 
        * @param [darkBorder] - Makes the border darker, in case this is a dark container
    */
    darkBorder?: boolean;

    /** 
        * @param [className] - Optional class to apply to the text area
    */
    className?: string;

    /** 
        * @param [onKeyDown] - Function to be called when a key is pressed down
    */
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    /** 
        * @param [onKeyUp] - Function to be called when a key is released
    */
    onKeyUp?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;

    /** 
        * @param [spellcheck] - Turn off spellcheck
    */
    spellCheck?: boolean;

    /** 
        * @param ref - Callback to set the ref of the text area
    */
    ref?: (ref: HTMLTextAreaElement) => void;
}): JSX.Element => {

    // Create better default values to handle optional params 
    const autoFocus = props.autoFocus === true
    const required = props.required === true
    const height = props.height || 'block'
    const width = props.width || 'block'

    const widthClass = `element-width-${width}`
    const heightClass = `element-height-${height}`

    return (
        <textarea 
            ref={props.ref}
            className={classNames('text-area', 'text-body-2', widthClass, heightClass, props.className, {'text-area-dark-border': props.darkBorder})}
            onChange={props.onChange} 
            autoFocus={autoFocus}
            required={required}
            placeholder={props.placeholder}
            value={props.value}
            disabled={props.disabled}
            onKeyDown={props.onKeyDown}
            onKeyUp={props.onKeyUp}
            spellCheck={props.spellCheck}
        />
    )
} 

export default TextArea;
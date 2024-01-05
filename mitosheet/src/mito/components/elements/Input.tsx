// Copyright (c) Mito
import React, { useEffect, useState, useRef } from 'react';

import '../../../../css/elements/Input.css'
import { classNames } from '../../utils/classNames';
import { Width } from './sizes.d';

interface InputProps {
    /** 
        * @param [id] - An optional id to put on the input, so it can be selected
    */
    id?: string;

    /** 
        * @param value - The text inside the input field
    */
    value: string;

    /** 
        * @param [placeholder] - The temporary text that fills the input before there is something there. If not provided, no placeholder text is displayed. 
    */
    placeholder?: string;

    /** 
        * @param [rightText] - light text to display on the right side of the input. The input makes sure that the text in the input does not overlap this text 
    */
    rightText?: string;

    /** 
        * @param [onKeyDown] - Function to be called when a key is pressed down
    */
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;

    /** 
        * @param [onKeyUp] - Function to be called when a key is up
    */
    onKeyUp?: (e: React.KeyboardEvent<HTMLInputElement>) => void;

    /** 
        * @param [onKeyPress] - Function to be called when a key is pressed
    */
    onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;

    /**
        * @param [onClick] - Function to be called with mouse is pressed 
    */
    onClick?: (e: React.MouseEvent) => void;

    /**
        * @param [onDoubleClick] - Function to be called when double clicked
     */
    onDoubleClick?: (e: React.MouseEvent) => void;

    /** 
        * @param [onChange] - Function to be called when the text changes
    */
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

    /** 
        * @param [onFocus] - Function to be called when the input is focused
    */
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;

    /** 
        * @param [onFocus] - Function to be called when the input is blured
    */
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;

    /** 
        * @param [width] - Size of the input. Defaults to block, which grows to fill the parent container
    */
    width?: Width;

    /** 
        * @param [widthOnFocus] - Size of the input when it is selected. Can set this to have the imput grow when it is selected
    */
    widthOnFocus?: Width;

    /** 
        * @param [autoFocus] - When true, the input automatically gets focused on
    */
    autoFocus?: boolean;

    /** 
        * @param [required] - When true, the input must be filled in the form it is in
    */
    required?: boolean;

    /** 
        * @param [disabled] - Disable the input 
    */
    disabled?: boolean;

    /** 
        * @param [type] - If this is a specific type of element (e.g. an email) you set that here
    */
    type?: 'text' | 'email' | 'date' | 'number' | 'password' | 'time';

    /** 
        * @param [className] - Optional class(es) to apply to this input
    */
    className?: string

    /** 
        * @param [onEscape] - Function to be called when the escape key is pressed
    */
    onEscape?: () => void

    /** 
        * @param [selectTextOnFocus] - Select all of the text when clicked. Helpful, for example, if there is only a space in the input  
    */
    selectTextOnFocus?: boolean

    /**
     * @param [style] - Optional style to apply to this input
     */
    style?: React.CSSProperties
}

/**
 * The input component is a text field that allows the user
 * to input a single item. It is meant for a single line of text,
 * like an email!
 */ 

const Input = (props: InputProps): JSX.Element => {

    const ref = useRef<HTMLInputElement>(null);

    // We store the width as state so that we can update it on focus
    // if there is a widthOnFocus
    const [width, setWidth] = useState(props.width);
    
    // Make defaults easier to work with
    const widthWithDefault = width || 'block';

    const autoFocus = props.autoFocus || false

    const widthClass = `element-width-${widthWithDefault}`

    // If there is right text, then we calcuate how much padding to give it, so that it doesn't
    // overlap with the text that is being typed in the input. We give 6px to each letter of the
    // text, and for a 5px padding on each side of the text
    const paddingRight = props.rightText !== undefined ? props.rightText.length * 6 + 10 : undefined;

    /*
        Setting the autoFocus field on the input element only seems to work when the input field 
        is inside of a form. Many times, the input fields we want to autofocus on is not part of a 
        form in Mito. So here, we manually set the focus.
    */ 
    useEffect(() => {
        if (autoFocus) {
            ref.current?.focus()
        }
    }, []);
    
    return (
        <div className='mito-input-container'>
            <input
                id={props.id}
                className={classNames('mito-input', 'text-body-2', widthClass, props.className)}
                style={{paddingRight: paddingRight, ...props.style}}
                value={props.value}
                placeholder={props.placeholder}
                onKeyDown={(e) => {
                    e.stopPropagation();
                    if (props.onKeyDown) {
                        props.onKeyDown(e)
                    }

                    if (props.onEscape && e.key == 'Escape') {
                        props.onEscape()
                    }
                }}
                onKeyUp={props.onKeyUp}
                onKeyPress={props.onKeyPress}
                onChange={props.onChange}
                onClick={props.onClick}
                onDoubleClick={props.onDoubleClick}
                autoFocus={props.autoFocus}
                required={props.required}
                disabled={props.disabled}
                type={props.type}
                ref={ref}
                onFocus={(e) => {
                    if (props.onFocus !== undefined) {
                        props.onFocus(e);
                    }
                    if (props.widthOnFocus !== undefined) {
                        setWidth(props.widthOnFocus)
                    }
                    if (props.selectTextOnFocus) {
                        // Select the entire text after a very short delay as to 
                        // not compete with the onClick.
                        setTimeout(() => {
                            e.target.select();
                        }, 50)
                    }
                }}
                onBlur={(e) => {
                    if (props.onBlur !== undefined) {
                        props.onBlur(e);
                    }
                    setWidth(props.width)
                }}
            />
            {props.rightText && 
                <div className='mito-input-right-text'>
                    {props.rightText}
                </div>
            }
            
        </div>
    )
};

export default Input;
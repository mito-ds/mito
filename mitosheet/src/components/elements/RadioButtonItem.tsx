// Copyright (c) Mito

import React from 'react';

import '../../../css/elements/RadioButtonBox.css'

/* 
  A single item that can be toggled 
*/
const RadioButtonItem = (props: {
    /** 
        * @param value - The title on the left side of this radio button item
    */
    value: string,
    /** 
        * @param checked - The state of the toggle for this item
    */
    checked: boolean,
    /** 
        * @param onToggle - The callback that should actually do the toggling in whatever manages the state for this toggle
    */
    onClick: () => void;
}): JSX.Element => {
    return (
        <div key={props.value} 
            onClick={() => {
                props.onClick();
            }}
            className='radio-button-box-row'
        >
            <input type="radio" name={props.value} value={props.value} checked={props.checked}/>
            <label htmlFor={props.value}>{props.value}</label>
        </div>
    )
}

export default RadioButtonItem;

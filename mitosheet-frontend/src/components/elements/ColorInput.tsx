// Copyright (c) Mito
import React from 'react';

// import css
import '../../../css/elements/ColorInput.css'

interface ColorInputProps {
    /** 
        * @param value - The color in the color selector. Should be a hex value
    */
    value: string;

    /**
        * @param onChange - Handles actually changing the value of the color
    */
    onChange: (newValue: string) => void;
}

/**
 * The ColorInput component allows the user to select a color using the browser
 * input.
 */
const ColorInput = (props: ColorInputProps): JSX.Element => {

    return (
        <input 
            className='color-input'
            type="color"
            value={props.value} 
            onChange={(e) => {
                props.onChange(e.target.value);
            }}
        />
    )
}

export default ColorInput;
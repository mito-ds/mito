// Copyright (c) Mito
import React from 'react';

// import css
import '../../../../css/elements/ColorInput.css';
import { useDebouncedEffect } from '../../hooks/useDebouncedEffect';
import ColorIcon from '../icons/GraphToolbar/ColorIcon';

interface ColorInputProps {
    /** 
        * @param value - The color in the color selector. Should be a hex value
    */
    value: string;

    /**
        * @param onChange - Handles actually changing the value of the color
    */
    onChange: (newValue: string) => void;

    /**
     * If the type is defined, we show a specific icon
     */
    type?: 'font-color' | 'background-color';

    /**
     * The id of the color input
     */
    id?: string;
}

/**
 * The ColorInput component allows the user to select a color using the browser
 * input.
 */
const ColorInput = (props: ColorInputProps): JSX.Element => {
    const [color, setColor] = React.useState<string>(props.value);

    useDebouncedEffect(() => {
        props.onChange(color);
    }, [color], 100);

    return (props.type === undefined ? 
        <input 
            className='color-input'
            type="color"
            value={props.value} 
            onChange={(e) => {
                setColor(e.target.value);
            }}
        /> : 
        <label className='mito-toolbar-button-icon-container' htmlFor={`color-picker-${props.id ?? ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '35px', justifyContent: 'space-evenly' }}>
            <ColorIcon type={props.type} />
            <input 
                id={`color-picker-${props.id ?? ''}`}
                className='color-input-with-icon'
                type="color"
                value={props.value} 
                onChange={(e) => {
                    setColor(e.target.value);
                }}
            />
        </label>
    )
}

export default ColorInput;
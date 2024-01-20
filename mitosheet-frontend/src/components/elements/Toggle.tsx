// Copyright (c) Mito
import React from 'react';

// import css
import '../../../css/elements/Toggle.css'
import { classNames } from '../../utils/classNames';

interface ToggleProps {
    /** 
        * @param value - The state of the toggle. True (On) or False (Off)
    */
    value: boolean;

    /**
        * @param onChange - Handles actually changing the value of the filter 
    */
    onChange: () => void;

    /**
        * @param [disabled] - Disables the toggle button
    */
    disabled?: boolean

    /**
        * @param [height] - Optionally set a height for the toggle
    */
    height?: string

    /**
        * @param [className] - Optionally set an additional class for the toggle
    */
    className?: string
    
    /**
        * @param [title] - Display title when hovering over toggle
    */
    title?: string

}

/**
 * The Toggle component. Allows the user to toggle something between On and Off.
 * 
 * The Toggle component utilizes the html input element with a type checkbox, so that we 
 * follow the design patterns of html elements. In order to create our custom designed toggle, 
 * we hide the default html checkbox and style the label property. 
 * 
 * Inspired by: https://stackoverflow.com/questions/39846282/how-to-add-the-text-on-and-off-to-toggle-button and 
 * https://www.youtube.com/watch?v=N8BZvfRD_eU
 */
const Toggle = (props: ToggleProps): JSX.Element => {

    const disabled = props.disabled === true
    const className = props.className !== undefined ? props.className : ''

    return (
        <label 
            className={classNames("toggle-label", className)} 
            style={props.height ? { "--toggle-height": props.height } as React.CSSProperties : {}}
            title={props.title}
        >
            {/* 
                Its important that the onClick event handler be on the input instead of the label because
                when the label is clicked, it also triggers the input's onClick event. If the onClick was registered
                on the label, this would cause it to be fired twice each time the user clicks.  
            */}
            <input 
                type="checkbox" 
                checked={props.value} 
                onClick={() => {
                    if (disabled) {
                        return;
                    }
                    props.onChange()
                }} 
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                onChange={() => {}} // We define this just to avoid warnings from React. We use the onClick instead
            />
            <div className={classNames("toggle", { 'toggle-disabled': disabled })}></div>
        </label>
    )
}

export default Toggle;
// Copyright (c) Mito
import React, { useState } from 'react';

// import css
import '../../../css/elements/Toggle.css'
import { classNames } from '../../utils/classNames';


interface ToggleProps {
    /** 
        * @param value - The state of the toggle. On or Off.
    */
    value: boolean;


    onChange?: (newValue: string) => void;
}

/**
 * The Toggle component. If open, the select dropdown automatically 
 * closes when the user clicks.
 * 
 * The Toggle class is built off of the html input element with a type checkbox, 
 * because that is the html default element for toggle functionality. To utilize the html
 * functionality, we create a checkbox. However, in order to create our custom designed toggle, 
 * we hide the default html checkbox and style the label property. 
 * 
 * This approach is suggested here: https://www.youtube.com/watch?v=N8BZvfRD_eU
 */
const Toggle = (props: ToggleProps): JSX.Element => {
    const [isOn, setIsOn] = useState(props.value)

    return (
        <div onClick={() => setIsOn(!isOn)}>
            {isOn}

            <input type="checkbox" id="check1" className="toggle" />
            <label className={classNames('text-body-1')} htmlFor="check1"></label>

        </div>
    )
}

export default Toggle;
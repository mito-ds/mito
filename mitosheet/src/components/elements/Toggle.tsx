// Copyright (c) Mito
import React from 'react';

// import css
import '../../../css/elements/Toggle.css'


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
 * The Toggle component utilizes the html input element with a type checkbox, so that we 
 * follow the design patterns of html elements. In order to create our custom designed toggle, 
 * we hide the default html checkbox and style the label property. 
 */
const Toggle = (props: ToggleProps): JSX.Element => {
    // const [isOn, setIsOn] = useState(props.value)
    console.log(props)

    return (
        <label className="switch">
            <input type="checkbox" />
            <div className="slider round"></div>
        </label>
    )
}

export default Toggle;
// Copyright (c) Mito
import React from 'react';
import { classNames } from '../../utils/classNames';


interface RadioButtonsProps {
    values: string[];
    selectedValue: string;
    onChange: (newValue: string) => void;
}

/**
 * The RadioButtonBox component lets the user select on option from a set of options, 
 * inside of a box that looks like the multi toggle box.
 */ 
const RadioButtonBox = (props: RadioButtonsProps): JSX.Element => {
    
    return (
        <div 
            className={classNames('text-body-2')} 
        >
            {props.values.map((value) => {
                const checked = value == props.selectedValue;

                return (
                    <div key={value} 
                        onClick={() => {
                            props.onChange(value);
                        }}
                    >
                        <input type="radio" name={value} value={value} checked={checked}/>
                        <label htmlFor={value}>{value}</label>
                    </div>
                )
            })}
        </div>
    )
} 

export default RadioButtonBox;
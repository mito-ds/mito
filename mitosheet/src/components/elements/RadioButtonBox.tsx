// Copyright (c) Mito
import React from 'react';
import { classNames } from '../../utils/classNames';
import '../../../css/elements/RadioButtonBox.css'
import { Height, Width } from './sizes.d';
import RadioButtonItem from './RadioButtonItem';


interface RadioButtonsProps {
    /**
        * @param values - The options for the user to pick between 
    */
    values: string[];
    /** 
        * @param selectedValue - The value currently selected
    */
    selectedValue: string | undefined;
    /**
        * @param onChange - function to set the selectedValue when radio button is selected
    */
    onChange: (newValue: string) => void;
    /** 
        * @param [height] - Height of the MultiToggleBox
    */
    height?: Height;
    /** 
        * @param [width] - Width of the MultiToggleBox
    */
    width?: Width;
    /** 
        * @param className - Optional class name to add to the multi toggle box
    */
    className?: string
}

/**
 * The RadioButtonBox component lets the user select on option from a set of options, 
 * inside of a box that looks like the multi toggle box.
 */ 
const RadioButtonBox = (props: RadioButtonsProps): JSX.Element => {

    const height = props.height || 'block'
    const width = props.width || 'block'
    const heightClass = `element-height-${height}`
    const widthClass = `element-width-${width}`
    
    return (
        <div 
            className={classNames('text-body-2', 'radio-button-box', heightClass, widthClass, props.className)} 
        >
            {props.values.map((value) => {
                return (
                    <RadioButtonItem
                        key={value}
                        value={value}
                        checked={value == props.selectedValue}
                        onClick={() => {
                            props.onChange(value);
                        }}
                    />
                )
            })}
        </div>
    )
} 

export default RadioButtonBox;
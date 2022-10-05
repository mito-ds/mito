// Copyright (c) Mito
import React from 'react';
import { classNames } from '../../utils/classNames';
import '../../../css/elements/RadioButtonBox.css'
import { Height, Width } from './sizes.d';
import RadioButtonItem from './RadioButtonItem';
import Row from '../layout/Row';


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
        * @param [className] - Optional class name to add to the multi toggle box
    */
    className?: string
    /** 
        * @param [loading] - If the data items are still being loaded
    */
    loading?: boolean
}

const RadioButtonBoxMessage = (props: {
    values: string[],
    loading?: boolean
}): JSX.Element | null => {
    if (props.loading) {
        return (
            <Row justify='center'>
                <p className='text-body-1'> 
                    Loading...
                </p>
            </Row>
        )
    } else if (props.values.length === 0) {
        return (
            <Row justify='center'>
                <p className='text-body-1'> 
                    No items to display.
                </p>
            </Row>
        )
    } 

    return null;
}

/**
 * The RadioButtonBox component lets the user select one option from a set of options, 
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
            <RadioButtonBoxMessage
                values={props.values}
                loading={props.loading}
            />
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
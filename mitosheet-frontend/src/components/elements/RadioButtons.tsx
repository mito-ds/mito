// Copyright (c) Mito
import React, { useEffect, useState } from 'react';
import { shuffle } from '../../utils/arrays';
import { classNames } from '../../utils/classNames';


interface RadioButtonsProps {
    values: string[];
    selectedValue: string;
    onChange: (newValue: string) => void;
    orientation: 'horizontal' | 'vertical'
    highlight?: boolean;
    randomOrder?: boolean;
}

/**
 * The RadioButtons component. Displays a set of options and allows
 * the user to toggle between them
 */ 
const RadioButtons = (props: RadioButtonsProps): JSX.Element => {

    const [possibleAnswers, setPossibleAnswers] = useState<string[]>([])

    // Set the possible answers. We don't set them prior to this
    // so that if we're setting a random order, the order of the 
    // values don't change after render.
    useEffect(() => {
        if (props.randomOrder) {
            setPossibleAnswers(shuffle(props.values));
        } else {
            setPossibleAnswers(props.values)
        }
    }, [])
    
    return (
        <div 
            className={classNames('text-body-2', 
                {'flexbox-row': props.orientation == 'horizontal'}, 
                {'flexbox-space-between': props.orientation == 'horizontal'},
                {'pl-20px pr-20px': props.orientation == 'horizontal'}
            )} 
            style={{'border': props.highlight ? '1px solid red' : ''}} // Give it a border if asked to highlight
        >
            {possibleAnswers.map((value, idx) => {
                const checked = value == props.selectedValue;

                return (
                    <div key={value} 
                        onClick={() => {
                            props.onChange(value);
                        }}
                        className={classNames({'mt-5px': idx !== 0 && props.orientation == 'vertical'})}
                    >
                        <input type="radio" name={value} value={value} checked={checked}/>
                        <label htmlFor={value}>{value}</label>
                    </div>
                )
            })}
        </div>
    )
} 

export default RadioButtons;
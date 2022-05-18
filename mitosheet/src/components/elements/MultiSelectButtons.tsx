// Copyright (c) Mito
import React from 'react';
import { classNames } from '../../utils/classNames';


interface MultiSelectButtonsProps {
    values: string[];
    selectedValues: string[];
    onChange: (newValue: string) => void;
}

/**
 * The MultiSelectButtons component displays a set of options and allows
 * the user to select as many as they'd like
 */ 
const MultiSelectButtons = (props: MultiSelectButtonsProps): JSX.Element => {
    
    return (
        <div 
            className={classNames('text-body-2')}
        >
            {props.values.map((value, idx) => {
                const checked = props.selectedValues.includes(value);
                console.log(props.selectedValues, value, checked)

                return (
                    <div key={value} 
                        onClick={() => {
                            console.log('changing: ', value)
                            props.onChange(value);
                        }}
                        className={classNames({'mt-5px': idx !== 0})}
                    >
                        <input type='checkbox' name={value} value={value} checked={checked}/>
                        <label htmlFor={value}>{value}</label>
                    </div>
                )
            })}
        </div>
    )
} 

export default MultiSelectButtons;
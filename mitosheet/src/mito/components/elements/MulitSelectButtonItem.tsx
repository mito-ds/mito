/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Copyright (c) Mito
import React from 'react';

interface MultiSelectButtonItem {
    /** 
        * @param id - If you want to display something other than what you actually store 
        * (e.g. display a columnHeader but store a columnID), then set the ID equal to the value 
        * that you want to store, and it will be used for the onToggle value.
    */
    id?: string;

    /** 
        * @param title - The main text to be displayed. 
    */
    title: string;

    /** 
        * @param checked - The state of the button. Checked or unchecked.
    */
    checked: boolean
    
    /**
        *  @param onToggle - Function to toggle the id/title
     */
    onToggle: (newValue: string) => void;
}


const MultiSelectButtonItem = (props: MultiSelectButtonItem): JSX.Element => {
    
    return (
        <div key={props.title} 
            onClick={() => {
                props.onToggle(props.id ? props.id : props.title);
            }}
            className='text-body-2'
        >
            <input type='checkbox' name={props.title} value={props.id ? props.id : props.title} checked={props.checked}/>
            <label style={{marginRight: '3px'}} htmlFor={props.title}>{props.title}</label>
        </div>
    )
} 

export default MultiSelectButtonItem;
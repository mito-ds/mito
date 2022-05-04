import React from 'react';
import { Action } from '../../types';
import DropdownItem from '../elements/DropdownItem';



// TOOD: explain why this has to be a function, b/c dropdown expects
// that specific element
export const makeToolbarDropdownItem = (action: Action): JSX.Element => {
    return (
        <DropdownItem 
            title={action.longTitle}
            onClick={action.actionFunction}
            disabled={action.isDisabled() !== undefined}                   
            tooltip={action.isDisabled()}                   
        />
    )
}
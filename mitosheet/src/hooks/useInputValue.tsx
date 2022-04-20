import { useState } from "react";

/* 
    This effect supplies an input with a value and an
    onChange function that updates the value when 
*/
export const useInputValue = (value: string='', placeholder: string=''): {value: string, placeholder: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void} => {
    const [_value, _setValue] = useState(value);
    
    const onChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const newValue = e.target.value;
        _setValue(newValue);
    }

    return {
        'value': _value,
        'placeholder': placeholder,
        'onChange': onChange
    }
}
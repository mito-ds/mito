import React from 'react';
import '../../style/TextAndIconButton.css';
import '../../style/button.css';
import { classNames } from '../utils/classNames';


export interface ButtonProps {
    text: string;
    onClick: () => void;
    title: string;
    variant: 'green' | 'red' | 'gray';
    width: 'block' | 'fit-contents';
}

// Text Button is just the basic Button Props, nothing else. 
interface TextButtonProps extends ButtonProps {}

const TextButton: React.FC<TextButtonProps> = ({ text, onClick, title, variant, width }) => {

    return (
        <button className={classNames(
            "text-button", 
            "button",
            `button-${variant}`,
            `button-width-${width}`
        )} onClick={onClick} title={title}>
            {text}
        </button>
    )
}

export default TextButton;
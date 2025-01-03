import React from 'react';
import '../../style/TextAndIconButton.css';
import '../../style/button.css';
import { classNames } from '../utils/classNames';


export interface ButtonProps {
    text: string;
    onClick: () => void;
    title: string;
    variant: 'green' | 'red' | 'gray';
}

// Text Button is just the basic Button Props, nothing else. 
interface TextButtonProps extends ButtonProps {}

const TextButton: React.FC<TextButtonProps> = ({ text, onClick, title, variant }) => {

    return (
        <button className={classNames("text-and-icon-button", `button-${variant}`)} onClick={onClick} title={title}>
            {text}
        </button>
    )
}

export default TextButton;
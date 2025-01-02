import React from 'react';
import '../../style/TextAndIconButton.css';
import '../../style/button.css';
import { ButtonProps } from './TextButton';
import { classNames } from '../utils/classNames';


interface TextAndIconButtonProps extends ButtonProps {
    icon: React.ComponentType;
}

const TextAndIconButton: React.FC<TextAndIconButtonProps> = ({ text, icon: Icon, onClick, title, variant }) => {

    return (
        <button className={classNames("text-and-icon-button", `button-${variant}`)} onClick={onClick} title={title}>
            {text}
            <span className="text-and-icon-button__icon">
                <Icon />
            </span>
        </button>
    )
}

export default TextAndIconButton;
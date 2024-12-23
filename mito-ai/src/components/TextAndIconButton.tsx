import React from 'react';
import '../../style/TextAndIconButton.css';

interface TextAndIconButtonProps {
    text: string;
    icon: React.ComponentType;
    onClick: () => void;
    title: string;
}

const TextAndIconButton: React.FC<TextAndIconButtonProps> = ({ text, icon: Icon, onClick, title }) => {

    return (
        <button className="text-and-icon-button" onClick={onClick} title={title}>
            {text}
            <span className="text-and-icon-button__icon">
                <Icon />
            </span>
        </button>
    )
}

export default TextAndIconButton;
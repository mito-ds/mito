import React from 'react';
import '../../style/IconButton.css';
import '../../style/button.css';
import { classNames } from '../utils/classNames';

interface IconButtonProps {
    icon: React.ReactNode;
    onClick: () => void;
    title: string;
    variant?: 'green' | 'red';
}

const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, title, variant }) => {

    return (
        <button className={classNames("icon-button", `button-${variant}`)} onClick={onClick} title={title}>
            {icon}
        </button>
    )
}

export default IconButton;
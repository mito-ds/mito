import React from 'react';
import '../../style/IconButton.css';

interface IconButtonProps {
    icon: React.ReactNode;
    onClick: () => void;
    title: string;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, title }) => {

    return (
        <button className="icon-button" onClick={onClick} title={title}>
            {icon}
        </button>
    )
}

export default IconButton;
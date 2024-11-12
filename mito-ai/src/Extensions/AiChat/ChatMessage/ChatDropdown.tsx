import React from 'react';

interface ChatDropdownProps {
    options: string[];
    selectedIndex: number;
    onSelect: (variableName: string) => void;
}

const ChatDropdown: React.FC<ChatDropdownProps> = ({
    options,
    selectedIndex,
    onSelect,
}) => {
    return (
        <ul className="chat-dropdown-list">
            {options.map((option, index) => (
                <li
                    key={option}
                    className={`chat-dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => onSelect(option)}
                >
                    {option}
                </li>
            ))}
        </ul>
    );
};

export default ChatDropdown; 
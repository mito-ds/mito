import React from 'react';

interface ChatDropdownProps {
    options: { variable_name: string, type: string }[];
    selectedIndex: number;
    onSelect: (variableName: string) => void;
}

const ChatDropdown: React.FC<ChatDropdownProps> = ({
    options,
    selectedIndex,
    onSelect,
}) => {
    const getShortType = (type: string) => {
        return type.includes("DataFrame") ? "df"
            : type.includes("<class '") ? type.split("'")[1]
                : type;
    }

    return (
        <ul className="chat-dropdown-list">
            {options.map((option, index) => (
                <li
                    key={option.variable_name}
                    className={`chat-dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => onSelect(option.variable_name)}
                >
                    <span className="chat-dropdown-item-type">
                        {getShortType(option.type)}
                    </span>
                    <span className="chat-dropdown-item-name">
                        {option.variable_name}
                    </span>
                </li>
            ))}
        </ul>
    );
};

export default ChatDropdown; 
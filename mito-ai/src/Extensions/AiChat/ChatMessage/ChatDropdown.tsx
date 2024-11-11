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
        <ul
            style={{
                position: "absolute",
                border: "1px solid #ccc",
                backgroundColor: "white",
                listStyleType: "none",
                padding: 0,
                margin: 0,
                width: "100%",
            }}
        >
            {options.map((option, index) => (
                <li
                    key={option}
                    onClick={() => onSelect(option)}
                    style={{
                        padding: "8px",
                        cursor: "pointer",
                        backgroundColor: index === selectedIndex ? '#e6e6e6' : 'white',
                    }}
                >
                    {option}
                </li>
            ))}
        </ul>
    );
};

export default ChatDropdown; 
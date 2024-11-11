import React from 'react';

interface ChatDropdownProps {
    options: string[];
    selectedIndex: number;
    onSelect: (username: string) => void;
}

const ChatDropdown: React.FC<ChatDropdownProps> = ({
    options,
    selectedIndex,
    onSelect,
}) => {
    return (
        <ul
            style={{
                // position: "absolute",
                // top: "100%",
                // left: "0",
                // right: "0",
                // background: "white",
                // border: "1px solid #ccc",
                // borderRadius: "4px",
                // listStyle: "none",
                // padding: "0",
                // margin: "4px 0 0 0",
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
import React from 'react';
import { ExpandedVariable } from './ChatInput';

interface ChatDropdownProps {
    options: ExpandedVariable[];
    selectedIndex: number;
    onSelect: (variableName: string, parentDf?: string) => void;
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
            {options.map((option, index) => {
                const uniqueKey = option.parent_df
                    ? `${option.parent_df}.${option.variable_name}`
                    : option.variable_name;

                return (
                    <li
                        key={uniqueKey}
                        className={`chat-dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
                        onClick={() => onSelect(option.variable_name, option.parent_df)}
                    >
                        <span className="chat-dropdown-item-type">
                            {getShortType(option.type)}
                        </span>
                        <span className="chat-dropdown-item-name">
                            {option.variable_name}
                        </span>
                        {option.parent_df && (
                            <span className="chat-dropdown-item-parent-df">
                                {option.parent_df}
                            </span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
};

export default ChatDropdown; 
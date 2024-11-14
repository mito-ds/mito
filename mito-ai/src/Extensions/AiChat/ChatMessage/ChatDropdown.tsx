import React, { useState, useEffect } from 'react';
import { ExpandedVariable } from './ChatInput';

interface ChatDropdownProps {
    options: ExpandedVariable[];
    onSelect: (variableName: string, parentDf?: string) => void;
    filterText: string;
}

const ChatDropdown: React.FC<ChatDropdownProps> = ({
    options,
    onSelect,
    filterText,
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [filteredOptions, setFilteredOptions] = useState<ExpandedVariable[]>([]);

    useEffect(() => {
        const filtered = options.filter((variable) =>
            variable.variable_name.toLowerCase().includes(filterText.toLowerCase()) &&
            variable.type !== "<class 'module'>"
        );
        setFilteredOptions(filtered);
        setSelectedIndex(0);
    }, [options, filterText]);

    const handleKeyDown = (event: KeyboardEvent) => {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setSelectedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                event.preventDefault();
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
                break;
            case 'Enter':
                event.preventDefault();
                if (filteredOptions[selectedIndex]) {
                    onSelect(filteredOptions[selectedIndex].variable_name, filteredOptions[selectedIndex].parent_df);
                }
                break;
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredOptions, selectedIndex]);

    const getShortType = (type: string) => {
        return type.includes("DataFrame") ? "df"
            : type.includes("<class '") ? type.split("'")[1]
                : type;
    }

    return (
        <ul className="chat-dropdown-list">
            {filteredOptions.map((option, index) => {
                const uniqueKey = option.parent_df
                    ? `${option.parent_df}.${option.variable_name}`
                    : option.variable_name;

                return (
                    <li
                        key={uniqueKey}
                        className={`chat-dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
                        onClick={() => onSelect(option.variable_name, option.parent_df)}
                    >
                        <span className="chat-dropdown-item-type"
                            style={{
                                color: getShortType(option.type) === 'df' ? 'blue'
                                    : getShortType(option.type) === 'col' ? 'orange'
                                        : "green"
                            }}
                        >
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
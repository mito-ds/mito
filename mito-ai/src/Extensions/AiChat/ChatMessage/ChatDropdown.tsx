/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect } from 'react';
import { classNames } from '../../../utils/classNames';
import { ExpandedVariable } from './ChatInput';

interface ChatDropdownProps {
    options: ExpandedVariable[];
    onSelect: (variableName: string, parentDf: string | undefined) => void;
    filterText: string;
    maxDropdownItems?: number;
    position?: 'above' | 'below';
}

const ChatDropdown: React.FC<ChatDropdownProps> = ({
    options,
    onSelect,
    filterText,
    maxDropdownItems = 10,
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredOptions = options.filter((variable) =>
        variable.variable_name.toLowerCase().includes(filterText.toLowerCase()) &&
        variable.type !== "<class 'module'>" &&
        variable.variable_name !== "FUNCTIONS" // This is default exported from mitosheet when you run from mitosheet import * as FUNCTIONS
    ).slice(0, maxDropdownItems);

    useEffect(() => {
        setSelectedIndex(0);
    }, [options, filterText]);

    const handleKeyDown = (event: KeyboardEvent): void => {
        switch (event.key) {
            case 'ArrowDown':
            case 'Down':
                event.preventDefault();
                setSelectedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
            case 'Up':
                event.preventDefault();
                setSelectedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                );
                break;
            case 'Enter':
            case 'Return':
            case 'Tab': {
                event.preventDefault();
                const selectedOption = filteredOptions[selectedIndex];
                if (selectedOption !== undefined) {
                    onSelect(selectedOption.variable_name, selectedOption.parent_df);
                }
                break;
            }
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredOptions, selectedIndex]);

    const getShortType = (type: string): string => {
        if (type.includes("DataFrame")) {
            return "df";
        }
        if (type.includes("Series")) {
            return "s";
        }
        if (type.includes("<class '")) {
            return type.split("'")[1] ?? '';
        }
        return type;
    }

    return (
        <div className={`chat-dropdown`} data-testid="chat-dropdown">
            <ul className="chat-dropdown-list" data-testid="chat-dropdown-list">
                {filteredOptions.length === 0 && (
                    <li className="chat-dropdown-item" data-testid="chat-dropdown-empty-item">No variables found</li>
                )}

                {filteredOptions.map((option, index) => {
                    const uniqueKey = option.parent_df
                        ? `${option.parent_df}.${option.variable_name}`
                        : option.variable_name;

                    return (
                        <li
                            key={uniqueKey}
                            className={classNames("chat-dropdown-item", { selected: index === selectedIndex })}
                            onClick={() => onSelect(option.variable_name, option.parent_df)}
                            data-testid={`chat-dropdown-item-${option.variable_name}`}
                        >
                            <span className="chat-dropdown-item-type"
                                title={getShortType(option.type)}
                                data-testid={`chat-dropdown-item-type-${option.variable_name}`}
                            >
                                {getShortType(option.type)}
                            </span>
                            <span
                                className="chat-dropdown-item-name"
                                title={option.variable_name}
                                data-testid={`chat-dropdown-item-name-${option.variable_name}`}
                                ref={(el) => {
                                    // Show full text on hover if the text is too long
                                    if (el) {
                                        el.title = el.scrollWidth > el.clientWidth ? option.variable_name : '';
                                    }
                                }}
                            >
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
        </div>
    );
};

export default ChatDropdown; 
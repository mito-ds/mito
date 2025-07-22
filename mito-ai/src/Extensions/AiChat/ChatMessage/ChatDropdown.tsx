/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ExpandedVariable } from './ChatInput';
import { getDatabaseConnections, getRules } from '../../../restAPI/RestAPI';
import { VariableDropdownItem, FileDropdownItem, RuleDropdownItem } from './ChatDropdownItems';

interface ChatDropdownProps {
    options: ExpandedVariable[];
    onSelect: (option: ChatDropdownOption) => void;
    filterText: string;
    maxDropdownItems?: number;
    position?: 'above' | 'below';
    isDropdownFromButton?: boolean;
    onFilterChange?: (filterText: string) => void;
    onClose?: () => void;
}

interface ChatDropdownVariableOption {
    type: 'variable'
    variable: ExpandedVariable;
}

interface ChatDropdownDatabaseOption {
    type: 'db'
    variable: ExpandedVariable;
}

interface ChatDropdownRuleOption {
    type: 'rule'
    rule: string;
}

interface ChatDropdownFileOption {
    type: 'file'
    file: ExpandedVariable;
}

export type ChatDropdownOption =
    | ChatDropdownVariableOption
    | ChatDropdownRuleOption
    | ChatDropdownFileOption
    | ChatDropdownDatabaseOption;

const ChatDropdown: React.FC<ChatDropdownProps> = ({
    options,
    onSelect,
    filterText,
    maxDropdownItems = 10,
    isDropdownFromButton = false,
    onFilterChange,
    onClose,
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [localFilterText, setLocalFilterText] = useState(filterText);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [rules, setRules] = useState<string[]>([]);
    const [databaseConnections, setDatabaseConnections] = useState<Record<string, any>>({});

    useEffect(() => {
        const fetchRules = async (): Promise<void> => {
            const rules = await getRules();
            setRules(rules);
        };
        const fetchDatabaseConnections = async (): Promise<void> => {
            const databaseConnections = await getDatabaseConnections();
            setDatabaseConnections(databaseConnections);
        };
        void fetchRules();
        void fetchDatabaseConnections();
    }, []);

    // Focus search input when dropdown opens with search input
    useEffect(() => {
        if (isDropdownFromButton && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isDropdownFromButton]);

    // Use local filter text when search input is shown, otherwise use prop
    const effectiveFilterText = isDropdownFromButton ? localFilterText : filterText;

    // Create a list of all options with the format 
    // ['type': 'variable', "expandedVariable": variable]
    // ['type': 'rule', "rule": rule]
    // ['type': 'file', "file": file]
    const allOptions: ChatDropdownOption[] = [
        // Rules first
        ...rules.map((rule): ChatDropdownRuleOption => ({
            type: 'rule',
            rule: rule
        })),
        // Files second
        ...options
            .filter(variable => variable.file_name) // Only files
            .map((file): ChatDropdownFileOption => ({
                type: 'file',
                file: file
            })),
        // Databases third
        ...Object.entries(databaseConnections).map(([connectionId, connection]): ChatDropdownDatabaseOption => ({
            type: 'db',
            variable: {
                variable_name: connection.alias || connection.database,
                type: "db",
                value: connectionId + " - " + connection.type,
                parent_df: connection.type
            }
        })),
        // Dataframes fourth
        ...options
            .filter(variable => !variable.file_name && variable.type === "pd.DataFrame")
            .map((variable): ChatDropdownVariableOption => ({
                type: 'variable',
                variable: variable
            })),
        // Columns fifth
        ...options
            .filter(variable => !variable.file_name && variable.parent_df && variable.type !== "pd.DataFrame")
            .map((variable): ChatDropdownVariableOption => ({
                type: 'variable',
                variable: variable
            })),
        // Other variables last
        ...options
            .filter(variable => !variable.file_name && !variable.parent_df && variable.type !== "pd.DataFrame")
            .map((variable): ChatDropdownVariableOption => ({
                type: 'variable',
                variable: variable
            })),
    ];

    const filteredOptions = allOptions.filter((option) => {
        if (option.type === 'variable') {
            return option.variable.variable_name.toLowerCase().includes(effectiveFilterText.toLowerCase()) &&
                option.variable.type !== "<class 'module'>" &&
                option.variable.variable_name !== "FUNCTIONS"; // This is default exported from mitosheet when you run from mitosheet import * as FUNCTIONS
        } else if (option.type === 'file') {
            return option.file.variable_name.toLowerCase().includes(effectiveFilterText.toLowerCase());
        } else if (option.type === 'db') {
            return option.variable.value.toLowerCase().includes(effectiveFilterText.toLowerCase());
        } else {
            return option.rule.toLowerCase().includes(effectiveFilterText.toLowerCase());
        }
    }).slice(0, maxDropdownItems);

    useEffect(() => {
        setSelectedIndex(0);
    }, [options, rules, effectiveFilterText]);

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
                    if (selectedOption.type === 'variable') {
                        onSelect(selectedOption);
                    } else {
                        onSelect(selectedOption);
                    }
                }
                break;
            }
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [filteredOptions, selectedIndex]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent): void => {
            const target = event.target as Node;
            const dropdownElement = document.querySelector('.chat-dropdown');

            if (dropdownElement && !dropdownElement.contains(target)) {
                if (onClose) {
                    onClose();
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const newFilterText = event.target.value;
        setLocalFilterText(newFilterText);
        if (onFilterChange) {
            onFilterChange(newFilterText);
        }
    };

    const handleSearchInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            if (onFilterChange) {
                onFilterChange(''); // Clear the filter
            }
            if (onClose) {
                onClose(); // Close the dropdown
            }
        }
    };

    return (
        <div className={`chat-dropdown`} data-testid="chat-dropdown">
            {isDropdownFromButton && (
                <div className="chat-dropdown-search">
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search variables and rules..."
                        value={localFilterText}
                        onChange={handleSearchInputChange}
                        onKeyDown={handleSearchInputKeyDown}
                        className="chat-dropdown-search-input"
                    />
                </div>
            )}
            <ul className="chat-dropdown-list" data-testid="chat-dropdown-list">
                {filteredOptions.length === 0 && (
                    <li className="chat-dropdown-item" data-testid="chat-dropdown-empty-item">No variables found</li>
                )}

                {filteredOptions.map((option, index) => {
                    switch (option.type) {
                        case 'variable': {
                            const uniqueKey = option.variable.parent_df
                                ? `${option.variable.parent_df}.${option.variable.variable_name}`
                                : option.variable.variable_name;
                            return (
                                <VariableDropdownItem
                                    key={uniqueKey}
                                    variable={option.variable}
                                    index={index}
                                    selectedIndex={selectedIndex}
                                    onSelect={() => onSelect(option)}
                                />
                            );
                        }
                        case 'file': {
                            const uniqueKey = option.file.variable_name;
                            return (
                                <FileDropdownItem
                                    key={uniqueKey}
                                    file={option.file}
                                    index={index}
                                    selectedIndex={selectedIndex}
                                    onSelect={() => onSelect(option)}
                                />
                            );
                        }
                        case 'rule': {
                            const uniqueKey = option.rule;
                            return (
                                <RuleDropdownItem
                                    key={uniqueKey}
                                    rule={option.rule}
                                    index={index}
                                    selectedIndex={selectedIndex}
                                    onSelect={() => onSelect(option)}
                                />
                            );
                        }
                        case 'db': {
                            const uniqueKey = option.variable.variable_name;
                            // You can replace VariableDropdownItem with a custom DBDropdownItem if you want
                            return (
                                <VariableDropdownItem
                                    key={uniqueKey}
                                    variable={option.variable}
                                    index={index}
                                    selectedIndex={selectedIndex}
                                    onSelect={() => onSelect(option)}
                                />
                            );
                        }
                        default:
                            return null;
                    }
                })}
            </ul>
        </div>
    );
};

export default ChatDropdown;
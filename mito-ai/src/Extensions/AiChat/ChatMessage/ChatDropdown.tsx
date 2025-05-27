/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState, useEffect } from 'react';
import { classNames } from '../../../utils/classNames';
import { ExpandedVariable } from './ChatInput';
import { getRules } from '../../../restAPI/RestAPI';

interface ChatDropdownProps {
    options: ExpandedVariable[];
    onSelect: (option: ChatDropdownOption) => void;
    filterText: string;
    maxDropdownItems?: number;
    position?: 'above' | 'below';
}

interface ChatDropdownVariableOption {
    type: 'variable'
    variable: ExpandedVariable;
}

interface ChatDropdownRuleOption {
    type: 'rule'
    rule: string;
}

export type ChatDropdownOption = ChatDropdownVariableOption | ChatDropdownRuleOption;

const ChatDropdown: React.FC<ChatDropdownProps> = ({
    options,
    onSelect,
    filterText,
    maxDropdownItems = 10,
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const [rules, setRules] = useState<string[]>([]);

    useEffect(() => {
        const fetchRules = async (): Promise<void> => {
            const rules = await getRules();
            setRules(rules);
        };
        void fetchRules();
    }, []);

    // Create a list of all options with the format 
    // ['type': 'variable', "expandedVariable": variable]
    // ['type': 'rule', "rule": rule]
    const allOptions: ChatDropdownOption[] = [
        ...options.map((variable): ChatDropdownVariableOption => ({ 
            type: 'variable', 
            variable: variable 
        })),
        ...rules.map((rule): ChatDropdownRuleOption => ({ 
            type: 'rule', 
            rule: rule 
        })),
    ];

    const filteredOptions = allOptions.filter((option) =>
        option.type === 'variable' ?
            option.variable.variable_name.toLowerCase().includes(filterText.toLowerCase()) &&
            option.variable.type !== "<class 'module'>" &&
            option.variable.variable_name !== "FUNCTIONS" // This is default exported from mitosheet when you run from mitosheet import * as FUNCTIONS
        :
            option.rule.toLowerCase().includes(filterText.toLowerCase())
    ).slice(0, maxDropdownItems);

    useEffect(() => {
        setSelectedIndex(0);
    }, [options, rules, filterText]);

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




    return (
        <div className={`chat-dropdown`} data-testid="chat-dropdown">
            <ul className="chat-dropdown-list" data-testid="chat-dropdown-list">
                {filteredOptions.length === 0 && (
                    <li className="chat-dropdown-item" data-testid="chat-dropdown-empty-item">No variables found</li>
                )}

                {filteredOptions.map((option, index) => {
                    let uniqueKey: string;
                    if (option.type === 'variable') {
                        uniqueKey = option.variable.parent_df
                            ? `${option.variable.parent_df}.${option.variable.variable_name}`
                            : option.variable.variable_name;
                    } else {
                        uniqueKey = option.rule;
                    }

                    if (option.type === 'variable') {
                        return (
                            <VariableDropdownItem
                                key={uniqueKey}
                                variable={option.variable}
                                index={index}   
                                selectedIndex={selectedIndex}
                                onSelect={() => onSelect(option)}
                            />
                        );
                    } else {
                        return (
                            <RuleDropdownItem
                                key={uniqueKey}
                                rule={option.rule}
                                index={index}
                                selectedIndex={selectedIndex}
                                onSelect={() => onSelect(option)}
                            />
                        )
                    }
                })}
            </ul>
        </div>
    );
};

export default ChatDropdown; 

interface VariableDropdownItemProps {
    variable: ExpandedVariable;
    index: number;
    selectedIndex: number;
    onSelect: (variableName: string, parentDf: string | undefined) => void;
}

const VariableDropdownItem: React.FC<VariableDropdownItemProps> = ({ variable, index, selectedIndex, onSelect }) => {

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
        <li
            className={classNames("chat-dropdown-item", { selected: index === selectedIndex })}
            onClick={() => onSelect(variable.variable_name, variable.parent_df)}
            data-testid={`chat-dropdown-item-${variable.variable_name}`}
        >
            <span className="chat-dropdown-item-type"
                title={getShortType(variable.type)}
                data-testid={`chat-dropdown-item-type-${variable.variable_name}`}
            >
                {getShortType(variable.type)}
            </span>
                <span
                    className="chat-dropdown-item-name"
                    title={variable.variable_name}
                    data-testid={`chat-dropdown-item-name-${variable.variable_name}`}
                    ref={(el) => {
                        // Show full text on hover if the text is too long
                        if (el) {
                            el.title = el.scrollWidth > el.clientWidth ? variable.variable_name : '';
                        }
                    }}
                >
                    {variable.variable_name}
                </span>
                {variable.parent_df && (
                    <span className="chat-dropdown-item-parent-df">
                        {variable.parent_df}
                    </span>
                )}
        </li>
    )
}

interface RuleDropdownItemProps {
    rule: string;
    index: number;
    selectedIndex: number;
    onSelect: (rule: string) => void;
}

const RuleDropdownItem: React.FC<RuleDropdownItemProps> = ({ rule, index, selectedIndex, onSelect }) => {
    return (
        <li
            className={classNames("chat-dropdown-item", { selected: index === selectedIndex })}
            onClick={() => onSelect(rule)}
            data-testid={`chat-dropdown-item-${rule}`}
        >
            {rule}
        </li>
    )
}
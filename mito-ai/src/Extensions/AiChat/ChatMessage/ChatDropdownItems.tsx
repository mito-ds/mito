/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { classNames } from '../../../utils/classNames';
import { ExpandedVariable } from './ChatInput';

interface VariableDropdownItemProps {
    variable: ExpandedVariable;
    index: number;
    selectedIndex: number;
    onSelect: (variableName: string, parentDf: string | undefined) => void;
}

export const VariableDropdownItem: React.FC<VariableDropdownItemProps> = ({ variable, index, selectedIndex, onSelect }) => {

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

interface FileDropdownItemProps {
    file: ExpandedVariable;
    index: number;
    selectedIndex: number;
    onSelect: (file: ExpandedVariable) => void;
}

export const FileDropdownItem: React.FC<FileDropdownItemProps> = ({ file, index, selectedIndex, onSelect }) => {
    return (
        <li
            className={classNames("chat-dropdown-item", { selected: index === selectedIndex })}
            onClick={() => onSelect(file)}
            data-testid={`chat-dropdown-item-${file.variable_name}`}
        >
            <span className="chat-dropdown-item-type"
                title={file.type}
                data-testid={`chat-dropdown-item-type-${file.variable_name}`}
            >
                {file.type}
            </span>
            <span
                className="chat-dropdown-item-name"
                title={file.variable_name}
                data-testid={`chat-dropdown-item-name-${file.variable_name}`}
                ref={(el) => {
                    // Show full text on hover if the text is too long
                    if (el) {
                        el.title = el.scrollWidth > el.clientWidth ? file.variable_name : '';
                    }
                }}
            >
                {file.variable_name}
            </span>
        </li>
    )
}

interface RuleDropdownItemProps {
    rule: string;
    index: number;
    selectedIndex: number;
    onSelect: (rule: string) => void;
}

export const RuleDropdownItem: React.FC<RuleDropdownItemProps> = ({ rule, index, selectedIndex, onSelect }) => {
    return (
        <li
            className={classNames("chat-dropdown-item", { selected: index === selectedIndex })}
            onClick={() => onSelect(rule)}
            data-testid={`chat-dropdown-item-${rule}`}
        >
            <span className="chat-dropdown-item-type"
                title="rule"
                data-testid={`chat-dropdown-item-type-${rule}`}
            >
                rule
            </span>
            <span
                className="chat-dropdown-item-name"
                title={rule}
                data-testid={`chat-dropdown-item-name-${rule}`}
                ref={(el) => {
                    // Show full text on hover if the text is too long
                    if (el) {
                        el.title = el.scrollWidth > el.clientWidth ? rule : '';
                    }
                }}
            >
                {rule}
            </span>
        </li>
    )
} 
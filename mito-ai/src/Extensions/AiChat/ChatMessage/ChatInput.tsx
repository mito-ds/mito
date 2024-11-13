import React, { useState, useEffect } from 'react';
import { classNames } from '../../../utils/classNames';
import { IVariableManager } from '../../VariableManager/VariableManagerPlugin';
import ChatDropdown from './ChatDropdown';
import { Variable } from '../../VariableManager/VariableInspector';

interface ChatInputProps {
    initialContent: string;
    placeholder: string;
    onSave: (content: string) => void;
    onCancel?: () => void;
    isEditing: boolean;
    variableManager?: IVariableManager;
}

export interface ExpandedVariable extends Variable {
    parent_df?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
    initialContent,
    placeholder,
    onSave,
    onCancel,
    isEditing,
    variableManager
}) => {
    const [input, setInput] = useState(initialContent);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [expandedVariables, setExpandedVariables] = useState<ExpandedVariable[]>([]);
    const [filteredOptions, setFilteredOptions] = useState<ExpandedVariable[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

    // By default the variable manager does not have series (cols).
    // So everytime the variable manager is updated, we loop through and expand the variables.
    useEffect(() => {
        // Start with an empty array
        const expandedVariables: ExpandedVariable[] = [];
        
        // Add base variables (excluding DataFrames since we'll handle their columns separately)
        const baseVariables = variableManager?.variables.filter(variable => variable.type !== "pd.DataFrame") || [];
        expandedVariables.push(...baseVariables);

        // Get all the dataframes and their columns
        const dfs = variableManager?.variables.filter((variable) => variable.type === "pd.DataFrame") || [];
        
        // Add the DataFrame variables themselves
        expandedVariables.push(...dfs);

        // Add series (columns) with their parent DataFrame references
        const series = dfs.flatMap((df) =>
            Object.entries(df.value).map(([seriesName, details]) => ({
                variable_name: seriesName,
                type: "col",
                value: "replace_me",
                parent_df: df.variable_name,
            })));

        expandedVariables.push(...series);
        
        // Update state with deduplicated variables
        setExpandedVariables(expandedVariables);
    }, [variableManager?.variables]);

    // TextAreas cannot automatically adjust their height based on the content that they contain, 
    // so instead we re-adjust the height as the content changes here. 
    const adjustHeight = () => {
        const textarea = textAreaRef?.current;
        if (!textarea) {
            return
        }
        textarea.style.minHeight = 'auto';

        // The height should be 20 at minimum to support the placeholder
        const minHeight = textarea.scrollHeight < 20 ? 20 : textarea.scrollHeight
        textarea.style.height = `${minHeight}px`;
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = event.target.value;
        setInput(value);

        const cursorPosition = event.target.selectionStart;
        const textBeforeCursor = value.slice(0, cursorPosition);
        const words = textBeforeCursor.split(/\s+/);
        const currentWord = words[words.length - 1];

        if (currentWord.startsWith("@")) {
            const query = currentWord.slice(1);
            const filtered = expandedVariables.filter((variable) =>
                variable.variable_name.toLowerCase().includes(query.toLowerCase()) &&
                variable.type !== "<class 'module'>" &&
                variable.type !== "col"
            ) || [];
            setFilteredOptions(filtered);
            setDropdownVisible(filtered.length > 0);
            setSelectedIndex(0);
        } else {
            setDropdownVisible(false);
            setFilteredOptions([]);
        }
    };

    const handleOptionSelect = (variableName: string, parentDf?: string) => {
        const textarea = document.querySelector('textarea');
        if (!textarea) return;

        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = input.slice(0, cursorPosition);
        const atIndex = textBeforeCursor.lastIndexOf("@");
        const textAfterAt = input.slice(atIndex);
        const endOfWord = textAfterAt.search(/[\s\n]|$/);

        let variableNameWithBackticks: string;
        if (!parentDf) {
            variableNameWithBackticks = `\`${variableName}\``
        } else {
            // If there is a parent df, format it like so: `df['col']`
            variableNameWithBackticks = `\`${parentDf}['${variableName}']\``
        }

        const newValue =
            input.slice(0, atIndex) +
            variableNameWithBackticks +
            input.slice(atIndex + endOfWord);
        setInput(newValue);

        setDropdownVisible(false);

        setTimeout(() => {
            if (textarea) {
                const newCursorPosition = atIndex + variableNameWithBackticks.length + 1;
                textarea.focus();
                textarea.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        }, 0);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // First check if dropdown is visible and handle those cases
        if (isDropdownVisible) {
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
                        handleOptionSelect(filteredOptions[selectedIndex].variable_name, filteredOptions[selectedIndex].parent_df);
                    }
                    break;
                case 'Escape':
                    setDropdownVisible(false);
                    break;
            }
            return; // Exit early if we handled dropdown navigation
        }

        // Handle non-dropdown keyboard events
        switch (event.key) {
            case 'Enter':
                if (!event.shiftKey) {
                    event.preventDefault();
                    onSave(input)
                    setInput('')
                }
                break;
            case 'Escape':
                event.preventDefault();
                if (onCancel) {
                    onCancel();
                }
                break;
            case 'Backspace': {
                // Handle backspace for deleting content between backticks
                const textarea = event.currentTarget;
                const cursorPosition = textarea.selectionStart;
                const textBeforeCursor = input.slice(0, cursorPosition);

                // Check if we're right after a closing backtick
                if (textBeforeCursor.endsWith('`')) {
                    const lastOpeningBacktick = textBeforeCursor.lastIndexOf('`', cursorPosition - 2);
                    if (lastOpeningBacktick !== -1) {
                        event.preventDefault();
                        // Remove everything between and including the backticks
                        const newValue =
                            input.slice(0, lastOpeningBacktick) +
                            input.slice(cursorPosition);
                        setInput(newValue);

                        // Set cursor position to where the opening backtick was
                        setTimeout(() => {
                            textarea.setSelectionRange(lastOpeningBacktick, lastOpeningBacktick);
                        }, 0);
                        return;
                    }
                }
                break;
            }
        }
    };

    useEffect(() => {
        adjustHeight();
    }, [textAreaRef?.current?.value]);

    return (
        <div style={{ position: 'relative' }}>
            <textarea
                ref={textAreaRef}
                className={classNames("message", "message-user", 'chat-input')}
                placeholder={placeholder}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
            />
            {isEditing &&
                <div className="message-edit-buttons">
                    <button onClick={() => onSave(input)}>Save</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            }
            {isDropdownVisible && (
                <ChatDropdown
                    options={filteredOptions}
                    selectedIndex={selectedIndex}
                    onSelect={handleOptionSelect}
                />
            )}
        </div>
    )
};

export default ChatInput;

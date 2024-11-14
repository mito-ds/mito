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
    const [dropdownFilter, setDropdownFilter] = useState('');
    const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

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
            setDropdownFilter(query);
            setDropdownVisible(true);
        } else {
            setDropdownVisible(false);
            setDropdownFilter('');
        }
    };

    const handleOptionSelect = (variableName: string, parentDf?: string) => {
        const textarea = textAreaRef.current;
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

    useEffect(() => {
        adjustHeight();
    }, [textAreaRef?.current?.value]);

    const expandedVariables: ExpandedVariable[] = [
        // Add base variables (excluding DataFrames)
        ...(variableManager?.variables.filter(variable => variable.type !== "pd.DataFrame") || []),
        // Add DataFrames
        ...(variableManager?.variables.filter((variable) => variable.type === "pd.DataFrame") || []),
        // Add series with parent DataFrame references
        ...(variableManager?.variables
            .filter((variable) => variable.type === "pd.DataFrame")
            .flatMap((df) =>
                Object.entries(df.value).map(([seriesName, details]) => ({
                    variable_name: seriesName,
                    type: "col",
                    value: "replace_me",
                    parent_df: df.variable_name,
                }))
            ) || [])
    ];

    return (
        <div style={{ position: 'relative' }}>
            <textarea
                ref={textAreaRef}
                className={classNames("message", "message-user", 'chat-input')}
                placeholder={placeholder}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                    // Enter key sends the message, but we still want to allow 
                    // shift + enter to add a new line.
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onSave(input)
                        setInput('')
                    }
                    // Escape key cancels editing
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        if (onCancel) {
                            onCancel();
                        }
                    }
                }}
            />
            {isEditing &&
                <div className="message-edit-buttons">
                    <button onClick={() => onSave(input)}>Save</button>
                    <button onClick={onCancel}>Cancel</button>
                </div>
            }
            {isDropdownVisible && (
                <ChatDropdown
                    options={expandedVariables}
                    onSelect={handleOptionSelect}
                    filterText={dropdownFilter}
                />
            )}
        </div>
    )
};

export default ChatInput;

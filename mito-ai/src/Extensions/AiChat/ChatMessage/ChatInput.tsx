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
    const [expandedVariables, setExpandedVariables] = useState<ExpandedVariable[]>([]);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [dropdownFilter, setDropdownFilter] = useState('');
    const [showDropdownAbove, setShowDropdownAbove] = useState(false);
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
        const textAfterCursor = input.slice(cursorPosition);
        // const textAfterAt = input.slice(atIndex);
        // const endOfWord = textAfterAt.search(/[\s\n]|$/);

        let variableNameWithBackticks: string;
        if (!parentDf) {
            variableNameWithBackticks = `\`${variableName}\``
        } else {
            variableNameWithBackticks = `\`${parentDf}['${variableName}']\``
        }

        const newValue =
            input.slice(0, atIndex) +
            variableNameWithBackticks +
            textAfterCursor;
        setInput(newValue);

        setDropdownVisible(false);

        setTimeout(() => {
            if (textarea) {
                const newCursorPosition = atIndex + variableNameWithBackticks.length;
                textarea.focus();
                textarea.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        }, 0);
    };

    useEffect(() => {
        adjustHeight();
    }, [textAreaRef?.current?.value]);

    // Update the expandedVariables arr when the variable manager changes
    useEffect(() => {
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
        setExpandedVariables(expandedVariables);
    }, [variableManager?.variables]);

    const calculateDropdownPosition = () => {
        if (!textAreaRef.current) return;

        const textarea = textAreaRef.current;
        const textareaRect = textarea.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const spaceBelow = windowHeight - textareaRect.bottom;

        // If space below is less than 200px (typical dropdown height), show above
        setShowDropdownAbove(spaceBelow < 200);
    };

    useEffect(() => {
        if (isDropdownVisible) {
            calculateDropdownPosition();
        }
    }, [isDropdownVisible]);

    return (
        <div style={{ position: 'relative' }}>
            {isDropdownVisible && showDropdownAbove && (
                <ChatDropdown
                    options={expandedVariables}
                    onSelect={handleOptionSelect}
                    filterText={dropdownFilter}
                    position="above"
                />
            )}
            <textarea
                ref={textAreaRef}
                className={classNames("message", "message-user", 'chat-input')}
                placeholder={placeholder}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                    // If dropdown is visible, only handle escape to close it
                    if (isDropdownVisible) {
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            setDropdownVisible(false);
                        }
                        return;
                    }

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
            {isDropdownVisible && !showDropdownAbove && (
                <ChatDropdown
                    options={expandedVariables}
                    onSelect={handleOptionSelect}
                    filterText={dropdownFilter}
                    position="below"
                />
            )}
        </div>
    )
};

export default ChatInput;

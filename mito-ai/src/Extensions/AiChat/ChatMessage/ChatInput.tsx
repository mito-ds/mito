import React, { useState, useEffect } from 'react';
import { classNames } from '../../../utils/classNames';
import { IVariableManager } from '../../VariableManager/VariableManagerPlugin';
import ChatDropdown from './ChatDropdown';

interface ChatInputProps {
    initialContent: string;
    placeholder: string;
    onSave: (content: string) => void;
    onCancel?: () => void;
    isEditing: boolean;
    variableManager?: IVariableManager;
}

const ChatInput: React.FC<ChatInputProps> = ({
    initialContent,
    placeholder,
    onSave,
    onCancel,
    isEditing,
    variableManager
}) => {
    const [input, setInput] = React.useState(initialContent);
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const textAreaRef = React.useRef<HTMLTextAreaElement>(null);

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
            const filtered = variableManager?.variables.filter((variable) => variable.variable_name.startsWith(query)) || [];
            setFilteredOptions(filtered.map(v => v.variable_name));
            setDropdownVisible(filtered.length > 0);
            setSelectedIndex(0);
        } else {
            setDropdownVisible(false);
        }
    };

    const handleOptionSelect = (variableName: string) => {
        const textarea = document.querySelector('textarea');
        if (!textarea) return;

        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = input.slice(0, cursorPosition);
        const atIndex = textBeforeCursor.lastIndexOf("@");
        const textAfterAt = input.slice(atIndex);
        const endOfWord = textAfterAt.search(/[\s\n]|$/);

        const newValue =
            input.slice(0, atIndex) +
            `@${variableName}` +
            input.slice(atIndex + endOfWord);

        setInput(newValue);
        setDropdownVisible(false);

        setTimeout(() => {
            if (textarea) {
                const newCursorPosition = atIndex + variableName.length + 1;
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
                        handleOptionSelect(filteredOptions[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    setDropdownVisible(false);
                    break;
            }
            return; // Exit early if we handled dropdown navigation
        }


        // Handle non-dropdown keyboard events
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            onSave(input)
            setInput('')
        } else if (event.key === 'Escape') {
            event.preventDefault();
            if (onCancel) {
                onCancel();
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

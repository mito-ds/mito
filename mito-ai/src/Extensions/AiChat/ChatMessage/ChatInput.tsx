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

    const handleVariableManagerClick = () => {
        console.log('variableManager', variableManager)
        variableManager?.variables.map((variable) => {
            console.log('name', variable.variable_name)
            console.log('type', variable.type)
            console.log('value', variable.value)
        })
    }

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

    const handleOptionSelect = (username: string) => {
        const textarea = document.querySelector('textarea');
        if (!textarea) return;

        const cursorPosition = textarea.selectionStart;
        const textBeforeCursor = input.slice(0, cursorPosition);
        const atIndex = textBeforeCursor.lastIndexOf("@");
        const textAfterAt = input.slice(atIndex);
        const endOfWord = textAfterAt.search(/[\s\n]|$/);

        const newValue =
            input.slice(0, atIndex) +
            `@${username}` +
            input.slice(atIndex + endOfWord);

        setInput(newValue);
        setDropdownVisible(false);

        setTimeout(() => {
            if (textarea) {
                const newCursorPosition = atIndex + username.length + 1;
                textarea.focus();
                textarea.setSelectionRange(newCursorPosition, newCursorPosition);
            }
        }, 0);
    };

    // const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    //     if (!isDropdownVisible) return;

    //     switch (event.key) {
    //         case 'ArrowDown':
    //             event.preventDefault();
    //             setSelectedIndex((prev) =>
    //                 prev < filteredOptions.length - 1 ? prev + 1 : prev
    //             );
    //             break;
    //         case 'ArrowUp':
    //             event.preventDefault();
    //             setSelectedIndex((prev) => prev > 0 ? prev - 1 : prev);
    //             break;
    //         case 'Enter':
    //             event.preventDefault();
    //             if (filteredOptions[selectedIndex]) {
    //                 handleOptionSelect(filteredOptions[selectedIndex]);
    //             }
    //             break;
    //         case 'Escape':
    //             setDropdownVisible(false);
    //             break;
    //     }
    // };

    useEffect(() => {
        adjustHeight();
    }, [textAreaRef?.current?.value]);

    return (
        <div>
            <textarea
                ref={textAreaRef}
                className={classNames("message", "message-user", 'chat-input')}
                placeholder={placeholder}
                value={input}
                // onChange={(e) => { setInput(e.target.value) }}
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
                    options={filteredOptions}
                    selectedIndex={selectedIndex}
                    onSelect={handleOptionSelect}
                />
            )}
            {variableManager &&
                <button onClick={handleVariableManagerClick}>
                    Open Variable Manager
                </button>
            }
        </div>
    )
};

export default ChatInput;

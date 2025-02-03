import React, { useEffect, useRef, useState } from 'react';
import { classNames } from '../utils/classNames';

interface AutoResizingTextAreaProps {
    initialContent?: string;
    placeholder?: string;
    onSave?: (content: string) => void;
    onCancel?: () => void;
    onChange?: (value: string) => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    className?: string;
    minHeight?: number;
}

const AutoResizingTextArea: React.FC<AutoResizingTextAreaProps> = ({
    initialContent = '',
    placeholder = '',
    onSave,
    onCancel,
    onChange,
    onKeyDown,
    className = '',
    minHeight = 80,
}) => {
    const [input, setInput] = useState(initialContent);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = (resetHeight: boolean = false) => {
        const textarea = textAreaRef?.current;
        if (!textarea) return;

        textarea.style.minHeight = 'auto';
        textarea.style.height = !textarea.value || resetHeight
            ? `${minHeight}px`
            : `${Math.max(minHeight, textarea.scrollHeight)}px`;
    };

    useEffect(() => {
        adjustHeight();
    }, [textAreaRef?.current?.value, minHeight]);

    const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = event.target.value;
        setInput(value);
        onChange?.(value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (onKeyDown) {
            onKeyDown(e);
            return;
        }

        // Default key handling if no custom handler provided
        if (e.key === 'Enter' && !e.shiftKey && onSave) {
            e.preventDefault();
            adjustHeight(true);
            onSave(input);
            setInput('');
        } else if (e.key === 'Escape' && onCancel) {
            e.preventDefault();
            onCancel();
        }
    };

    return (
        <textarea
            ref={textAreaRef}
            className={classNames("message", "message-user", 'chat-input', className)}
            placeholder={placeholder}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
        />
    );
};

export default AutoResizingTextArea;
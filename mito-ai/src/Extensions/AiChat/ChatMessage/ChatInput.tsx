import React, { useEffect } from 'react';
import { classNames } from '../../../utils/classNames';

interface ChatInputProps {
    initialContent: string;
    placeholder: string;
    onSave: (content: string) => void;
    onCancel?: () => void ;
    isEditing: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
    initialContent,
    placeholder,
    onSave,
    onCancel,
    isEditing
}) => {
    const [input, setInput] = React.useState(initialContent);
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

    useEffect(() => {
        adjustHeight();
    }, [textAreaRef?.current?.value]);

    return (
        <>
            <textarea
                ref={textAreaRef}
                className={classNames("message", "message-user", 'chat-input')}
                placeholder={placeholder}
                value={input}
                onChange={(e) => { setInput(e.target.value) }}
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
        </>
    )
};

export default ChatInput;

import React from 'react';

interface ChatInputProps {
    initialContent: string;
    onSave: (content: string) => void;
    onCancel: () => void;
}

const ChatInput: React.FC<ChatInputProps> = ({
    initialContent,
    onSave,
    onCancel
}) => {
    const [editedContent, setEditedContent] = React.useState(initialContent);

    return (
        <>
            <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={(e) => {
                    // Enter key sends the message, but we still want to allow 
                    // shift + enter to add a new line.
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        onSave(editedContent);
                    }
                    // Escape key cancels editing
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        onCancel();
                    }
                }}
                className="message-edit-textarea"
                autoFocus
            />
            <div className="message-edit-buttons">
                <button onClick={() => onSave(editedContent)}>Save</button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        </>
    );
};

export default ChatInput;

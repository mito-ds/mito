/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

import '../../../style/Comments.css';

export interface CommentPopoverPosition {
    top: number;
    left: number;
}

interface CommentPopoverProps {
    position: CommentPopoverPosition;
    onSubmit: (comment: string) => void;
    onCancel: () => void;
}

const CommentPopover: React.FC<CommentPopoverProps> = ({ position, onSubmit, onCancel }) => {
    const [comment, setComment] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        // Focus the textarea when the popover opens
        textareaRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (comment.trim()) {
                onSubmit(comment.trim());
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    return ReactDOM.createPortal(
        <>
            <div className="comment-popover-backdrop" onClick={onCancel} />
            <div
                className="comment-popover"
                style={{ top: position.top, left: position.left }}
                onClick={(e) => e.stopPropagation()}
            >
                <textarea
                    ref={textareaRef}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a comment for the AI..."
                />
                <div className="comment-popover-buttons">
                    <button onClick={onCancel}>Cancel</button>
                    <button
                        className="comment-popover-submit"
                        onClick={() => {
                            if (comment.trim()) {
                                onSubmit(comment.trim());
                            }
                        }}
                        disabled={!comment.trim()}
                    >
                        Add
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
};

export default CommentPopover;

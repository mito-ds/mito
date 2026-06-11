/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import {
    DocumentCommentResponseStatus,
    IDocumentCommentThread,
} from '../../utils/documentCommentMetadata';

// Speech bubble SVG (matches the comment tooltip icon)
const CHAT_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="currentColor"/></svg>`;

export interface ICommentThreadPopoverHandle {
    updateResponse: (content: string, status: DocumentCommentResponseStatus, error?: string) => void;
    close: () => void;
}

/**
 * Shows a Google Docs-style comment thread card: the user's comment, Mito's
 * (possibly still streaming) answer, and Add to Chat / Resolve actions.
 */
export function showCommentThreadPopover(options: {
    rect: DOMRect;
    thread: IDocumentCommentThread;
    onAddToChat: () => void;
    onResolve: () => void;
}): ICommentThreadPopoverHandle {
    const { rect, thread, onAddToChat, onResolve } = options;

    const backdrop = document.createElement('div');
    backdrop.className = 'comment-popover-backdrop';

    const popover = document.createElement('div');
    popover.className = 'comment-popover comment-thread-popover';

    // Position the popover, keeping it within the viewport on all sides
    const popoverWidth = 360;
    const popoverHeight = 320;
    const gap = 4;
    const margin = 16;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (rect.bottom + gap + popoverHeight > vh - margin) {
        popover.style.bottom = `${vh - rect.top + gap}px`;
    } else {
        popover.style.top = `${rect.bottom + gap}px`;
    }

    const rightEdge = vw - rect.right;
    if (rect.right - popoverWidth < margin) {
        popover.style.left = `${Math.max(margin, rect.left)}px`;
    } else if (rect.right > vw - margin) {
        popover.style.right = `${margin}px`;
    } else {
        popover.style.right = `${rightEdge}px`;
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'comment-popover-close';
    closeBtn.textContent = '×';

    // User's comment
    const userMessage = document.createElement('div');
    userMessage.className = 'comment-thread-message';
    const userAuthor = document.createElement('div');
    userAuthor.className = 'comment-thread-author';
    userAuthor.textContent = 'You';
    const userText = document.createElement('div');
    userText.className = 'comment-thread-text';
    userText.textContent = thread.comment;
    userMessage.appendChild(userAuthor);
    userMessage.appendChild(userText);

    const divider = document.createElement('div');
    divider.className = 'comment-thread-divider';

    // Mito's response
    const responseMessage = document.createElement('div');
    responseMessage.className = 'comment-thread-message';
    const responseAuthor = document.createElement('div');
    responseAuthor.className = 'comment-thread-author';
    responseAuthor.textContent = 'Mito';
    const responseText = document.createElement('div');
    responseText.className = 'comment-thread-text comment-thread-response';
    const loadingDots = document.createElement('div');
    loadingDots.className = 'comment-thread-loading-dots';
    loadingDots.innerHTML = '<span></span><span></span><span></span>';
    responseMessage.appendChild(responseAuthor);
    responseMessage.appendChild(responseText);
    responseMessage.appendChild(loadingDots);

    // Action buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'comment-popover-buttons';

    const addToChatBtn = document.createElement('button');
    addToChatBtn.className = 'comment-thread-add-to-chat';
    addToChatBtn.innerHTML = `${CHAT_SVG}<span>Add to Chat</span>`;
    addToChatBtn.title = 'Send this discussion to the AI chat so the agent can take action on it';

    const resolveBtn = document.createElement('button');
    resolveBtn.className = 'comment-thread-resolve';
    resolveBtn.textContent = 'Resolve';
    resolveBtn.title = 'Remove this comment thread from the notebook';

    buttonsDiv.appendChild(addToChatBtn);
    buttonsDiv.appendChild(resolveBtn);

    popover.appendChild(closeBtn);
    popover.appendChild(userMessage);
    popover.appendChild(divider);
    popover.appendChild(responseMessage);
    popover.appendChild(buttonsDiv);

    const close = (): void => {
        backdrop.remove();
        popover.remove();
    };

    const updateResponse = (
        content: string,
        status: DocumentCommentResponseStatus,
        error?: string,
    ): void => {
        const isPending = status === 'loading' || status === 'streaming';
        loadingDots.style.display = status === 'loading' ? 'flex' : 'none';

        if (status === 'error') {
            responseText.textContent = error || 'Something went wrong getting a response.';
            responseText.classList.add('comment-thread-response-error');
        } else {
            responseText.textContent = content;
            responseText.classList.remove('comment-thread-response-error');
        }

        // The agent can only act on a complete discussion
        addToChatBtn.disabled = isPending;

        // Keep the latest streamed text visible
        responseText.scrollTop = responseText.scrollHeight;
    };

    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    addToChatBtn.addEventListener('click', () => {
        onAddToChat();
        close();
    });
    resolveBtn.addEventListener('click', () => {
        onResolve();
        close();
    });
    popover.addEventListener('click', (e) => e.stopPropagation());

    document.body.appendChild(backdrop);
    document.body.appendChild(popover);

    updateResponse(thread.response, thread.responseStatus, thread.responseError);

    return { updateResponse, close };
}

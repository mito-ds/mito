/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import TextButton from '../../../components/TextButton';
import { logEvent } from '../../../restAPI/RestAPI';
import { ChatHistoryManager } from '../ChatHistoryManager';
import '../../../../style/RevertQuestionnaire.css';

interface RevertQuestionnaireProps {
    onDestroy: () => void;
    getDuplicateChatHistoryManager: () => ChatHistoryManager;
    setChatHistoryManager: (chatHistoryManager: ChatHistoryManager) => void;
}

const RevertQuestionnaire: React.FC<RevertQuestionnaireProps> = ({ onDestroy, getDuplicateChatHistoryManager, setChatHistoryManager }) => {
    const CHOICES = [
        'AI misunderstood me',
        'Code was buggy/incorrect',
        'Code was low quality',
        'I changed my mind about what I wanted'
    ]

    const handleButtonClick = (choice: string): void => {
        // Log the event
        void logEvent('mito_ai_revert_questionnaire_choice', { 'reason': choice });

        // Add a message to the chat history
        const newChatHistoryManager = getDuplicateChatHistoryManager();
        newChatHistoryManager.addAIMessageFromResponse(
            "I've reverted all previous changes.",
            "chat",
            false
        )
        setChatHistoryManager(newChatHistoryManager);

        // Destroy the component (set showRevertQuestionnaire to false)
        onDestroy();
    };

    return (
        <div className='message revert-questionnaire-message'>
            <p className='revert-questionnaire-message-text'>What went wrong?</p>
            {CHOICES.map((choice) => (
                <>
                    <TextButton
                        text={choice}
                        onClick={() => handleButtonClick(choice)}
                        title={choice}
                        variant='gray'
                        width='block'
                        textAlign='left'
                        className="revert-questionnaire-button"
                    />
                </>
            ))}
        </div>
    );
};

export default RevertQuestionnaire;
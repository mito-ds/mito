/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import TextButton from '../../../components/TextButton';
import { logEvent } from '../../../restAPI/RestAPI';
import { ChatHistoryManager } from '../ChatHistoryManager';

interface RevertQuestionnaireProps {
    onDestroy: () => void;
    getDuplicateChatHistoryManager: () => ChatHistoryManager;
    setChatHistoryManager: (chatHistoryManager: ChatHistoryManager) => void;
}

const RevertQuestionnaire: React.FC<RevertQuestionnaireProps> = ({ onDestroy, getDuplicateChatHistoryManager, setChatHistoryManager }) => {
    const CHOICES = [
        'The output didn’t run or gave the wrong result.',
        'The code didn’t match my intent.',
        'The code works, but it’s not readable or easy to follow.',
        'I realized I wanted to do something else.'
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
        <div className='message'>
            <p>What went wrong?</p>
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
                    <br />
                </>
            ))}
        </div>
    );
};

export default RevertQuestionnaire;
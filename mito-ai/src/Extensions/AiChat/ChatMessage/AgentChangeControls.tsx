/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useState } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import TextAndIconButton from '../../../components/TextAndIconButton';
import UndoIcon from '../../../icons/UndoIcon';
import { restoreCheckpoint } from '../../../utils/checkpoint';
import { scrollToDiv } from '../../../utils/scroll';
import { AgentExecutionStatus } from '../ChatTaskpane';

interface IAgentChangeControlsProps {
    hasCheckpoint: boolean;
    agentModeEnabled: boolean;
    agentExecutionStatus: AgentExecutionStatus;
    displayOptimizedChatHistoryLength: number;
    reviewAgentChanges: () => void;
    app: JupyterFrontEnd;
    notebookTracker: INotebookTracker;
    setHasCheckpoint: (value: boolean) => void;
    setDisplayedNextStepsIfAvailable: (value: boolean) => void;
    setShowRevertQuestionnaire: (value: boolean) => void;
    chatMessagesRef: React.RefObject<HTMLDivElement>;
    acceptAllAICode: () => void;
}

const AgentChangeControls: React.FC<IAgentChangeControlsProps> = ({
    hasCheckpoint,
    agentModeEnabled,
    agentExecutionStatus,
    displayOptimizedChatHistoryLength,
    reviewAgentChanges,
    app,
    notebookTracker,
    setHasCheckpoint,
    setDisplayedNextStepsIfAvailable,
    setShowRevertQuestionnaire,
    chatMessagesRef,
    acceptAllAICode,
}) => {
    // Only show when agent checkpoint exists and agent is idle
    if (
        !hasCheckpoint ||
        !agentModeEnabled ||
        agentExecutionStatus !== 'idle' ||
        displayOptimizedChatHistoryLength === 0
    ) {
        return null;
    }

    const [isReviewing, setIsReviewing] = useState(false);

    return (
        <div className='message message-assistant-chat'>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isReviewing ? (
                    <button
                        className="button-base button-green"
                        title="Accept all changes"
                        onClick={() => {
                            acceptAllAICode();
                        }}
                    >
                        Accept all
                    </button>
                ) : (
                    <button
                        className="button-base button-gray"
                        onClick={() => {
                            setIsReviewing(true);
                            reviewAgentChanges();
                        }}
                    >
                        Review Changes
                    </button>
                )}
                <TextAndIconButton
                    text="Revert changes"
                    icon={UndoIcon}
                    title="Revert changes"
                    onClick={() => {
                        void restoreCheckpoint(app, notebookTracker, setHasCheckpoint)
                        setDisplayedNextStepsIfAvailable(false)
                        setHasCheckpoint(false)
                        setShowRevertQuestionnaire(true)
                        scrollToDiv(chatMessagesRef);
                    }}
                    variant="gray"
                    width="fit-contents"
                    iconPosition="left"
                />
            </div>
        </div>
    );
};

export default AgentChangeControls;


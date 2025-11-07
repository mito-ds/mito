/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { restoreCheckpoint } from '../../../utils/checkpoint';
import { scrollToDiv } from '../../../utils/scroll';
import { AgentReviewStatus } from '../ChatTaskpane';
import TextButton from '../../../components/TextButton';

interface IAgentChangeControlsProps {
    reviewAgentChanges: () => void;
    app: JupyterFrontEnd;
    notebookTracker: INotebookTracker;
    setHasCheckpoint: (value: boolean) => void;
    setDisplayedNextStepsIfAvailable: (value: boolean) => void;
    setShowRevertQuestionnaire: (value: boolean) => void;
    chatTaskpaneMessagesRef: React.RefObject<HTMLDivElement>;
    acceptAllAICode: () => void;
    rejectAllAICode: () => void;
    setAgentReviewStatus: (status: AgentReviewStatus) => void;
    agentReviewStatus: AgentReviewStatus;
}

const AgentChangeControls: React.FC<IAgentChangeControlsProps> = ({
    reviewAgentChanges,
    app,
    notebookTracker,
    setHasCheckpoint,
    setDisplayedNextStepsIfAvailable,
    setShowRevertQuestionnaire,
    chatTaskpaneMessagesRef,
    acceptAllAICode,
    rejectAllAICode,
    setAgentReviewStatus,
    agentReviewStatus,
}) => {

    const handleReviewChanges = (): void => {
        setAgentReviewStatus('in-agent-code-review');
        reviewAgentChanges();
    }

    const handleAcceptAll = (): void => {
        acceptAllAICode();
        setAgentReviewStatus('post-agent-code-review');
    }

    const handleRejectAll = (): void => {
        rejectAllAICode();
        setAgentReviewStatus('post-agent-code-review');
    }

    const handleUndoAll = async (): Promise<void> => {
        await restoreCheckpoint(app, notebookTracker, setHasCheckpoint);
        setDisplayedNextStepsIfAvailable(false);
        setHasCheckpoint(false);
        setAgentReviewStatus('post-agent-code-review');
        setShowRevertQuestionnaire(true);
        scrollToDiv(chatTaskpaneMessagesRef);
    }

    if (agentReviewStatus === 'pre-agent-code-review') {
        return (
            <div className='message message-assistant-chat'>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <TextButton
                        text="Review Changes"
                        title="Review the changes made by the agent"
                        onClick={handleReviewChanges}
                        variant="gray"
                        width="fit-contents"
                    />
                    <TextButton
                        text="Undo All"
                        title="Undo all of the most recent changes made by the agent"
                        onClick={handleUndoAll}
                        variant="gray"
                        width="fit-contents"
                    />
                </div>
            </div>
        )
    }

    if (agentReviewStatus === 'in-agent-code-review') {
        return (
            <div className='message message-assistant-chat'>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        className="button-base button-green"
                        title="Accept all changes"
                        onClick={handleAcceptAll}
                    >
                        Accept all
                    </button>
                    <button
                        className="button-base button-red"
                        onClick={handleRejectAll}
                    >
                        Reject All
                    </button>
                </div>
            </div>
        )
    }

    if (agentReviewStatus === 'post-agent-code-review') {
        return (
            <div className='message message-assistant-chat'>
                <TextButton
                    text="Undo All"
                    onClick={handleUndoAll}
                    variant="gray"
                    width="fit-contents"
                    title="Undo all of the most recent changes made by the agent"
                />
            </div>
        )
    }   

    return null;
};

export default AgentChangeControls;


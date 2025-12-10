/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { restoreCheckpoint } from '../../../utils/checkpoint';
import { scrollToDiv } from '../../../utils/scroll';
import { AgentReviewStatus } from '../ChatTaskpane';
import TextButton from '../../../components/TextButton';
import '../../../../style/AgentChangeControls.css';

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
    getReviewProgress: () => { reviewed: number; total: number };
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
    getReviewProgress,
    setAgentReviewStatus,
    agentReviewStatus,
}) => {
    const [reviewProgress, setReviewProgress] = useState<{ reviewed: number; total: number } | null>(null);

    // Update counts when review starts
    useEffect(() => {
        if (agentReviewStatus === 'in-agent-code-review') {
            const progress = getReviewProgress();
            setReviewProgress(progress);
        } else {
            setReviewProgress(null);
        }
    }, [agentReviewStatus, getReviewProgress]);

    
    useEffect(() => {
        // Update progress periodically during review to reflect when cells are reviewed.
        // We use polling here instead of event-driven updates because it's simpler and more robust -
        // cells can be reviewed through multiple paths (toolbar buttons, keyboard shortcuts, etc.)
        // and polling ensures we catch all updates without having to wire up triggers everywhere.
        
        if (agentReviewStatus !== 'in-agent-code-review') {
            return;
        }

        const updateProgress = (): void => {
            const progress = getReviewProgress();
            setReviewProgress(progress);
        };

        // Update immediately
        updateProgress();

        // Set up interval to update progress
        const interval = setInterval(updateProgress, 500);

        return () => clearInterval(interval);
    }, [agentReviewStatus]);

    const handleReviewChanges = (): void => {
        reviewAgentChanges();
        setAgentReviewStatus('in-agent-code-review');
        // Scroll to show the new review controls after the UI updates
        setTimeout(() => {
            scrollToDiv(chatTaskpaneMessagesRef);
        }, 0);
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
                <div className="agent-change-controls-buttons">
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
                <div className="agent-change-controls-container">
                    <div className="agent-change-controls-buttons">
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
                    {reviewProgress && reviewProgress.total > 0 && (
                        <div className="agent-review-progress">
                            {reviewProgress.reviewed}/{reviewProgress.total} changes reviewed
                        </div>
                    )}
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


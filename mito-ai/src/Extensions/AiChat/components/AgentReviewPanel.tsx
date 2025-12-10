/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import AgentChangeControls from '../ChatMessage/AgentChangeControls';
import AgentChangeSummary from '../ChatMessage/AgentChangeSummary';
import RevertQuestionnaire from '../ChatMessage/RevertQuestionnaire';
import { ChatHistoryManager } from '../ChatHistoryManager';
import { AgentReviewStatus } from '../ChatTaskpane';
import { AgentReviewChangeCounts } from '../hooks/useAgentReview';

interface AgentReviewPanelProps {
    // Agent review state
    hasCheckpoint: boolean;
    agentModeEnabled: boolean;
    agentExecutionStatus: 'working' | 'stopping' | 'idle';
    showRevertQuestionnaire: boolean;
    agentReviewStatus: AgentReviewStatus;
    setAgentReviewStatus: (status: AgentReviewStatus) => void;

    // Agent review functions
    reviewAgentChanges: () => void;
    acceptAllAICode: () => void;
    rejectAllAICode: () => void;
    getChangeCounts: () => AgentReviewChangeCounts;
    getReviewProgress: () => { reviewed: number; total: number };
    hasChanges: () => boolean;
    setHasCheckpoint: (value: boolean) => void;
    setDisplayedNextStepsIfAvailable: (value: boolean) => void;
    setShowRevertQuestionnaire: (value: boolean) => void;
    getDuplicateChatHistoryManager: () => ChatHistoryManager;
    setChatHistoryManager: (manager: ChatHistoryManager) => void;

    // Required props
    app: JupyterFrontEnd;
    notebookTracker: INotebookTracker;
    chatTaskpaneMessagesRef: React.RefObject<HTMLDivElement>;
}

const AgentReviewPanel: React.FC<AgentReviewPanelProps> = ({
    agentReviewStatus,
    setAgentReviewStatus,
    hasCheckpoint,
    agentModeEnabled,
    agentExecutionStatus,
    showRevertQuestionnaire,
    reviewAgentChanges,
    acceptAllAICode,
    rejectAllAICode,
    getChangeCounts,
    getReviewProgress,
    hasChanges,
    setHasCheckpoint,
    setDisplayedNextStepsIfAvailable,
    setShowRevertQuestionnaire,
    getDuplicateChatHistoryManager,
    setChatHistoryManager,
    app,
    notebookTracker,
    chatTaskpaneMessagesRef
}) => {

    const agentFinished = hasCheckpoint && agentModeEnabled && agentExecutionStatus === 'idle';
    const shouldShowAgentChangeControls = agentFinished && hasChanges();
    const shouldShowSummary = agentFinished && (agentReviewStatus === 'pre-agent-code-review' || agentReviewStatus === 'in-agent-code-review');

    return (
        <>
            {/* Agent change summary - shows after agent completes, before review starts */} 
            {shouldShowSummary && (
                <div className='message message-assistant-chat'>
                    <AgentChangeSummary getChangeCounts={getChangeCounts} />
                </div>
            )}

            {/* Agent restore button - shows after agent completes and when agent checkpoint exists */}
            {shouldShowAgentChangeControls && (
                <AgentChangeControls
                    reviewAgentChanges={reviewAgentChanges}
                    app={app}
                    notebookTracker={notebookTracker}
                    setHasCheckpoint={setHasCheckpoint}
                    setDisplayedNextStepsIfAvailable={setDisplayedNextStepsIfAvailable}
                    setShowRevertQuestionnaire={setShowRevertQuestionnaire}
                    chatTaskpaneMessagesRef={chatTaskpaneMessagesRef}
                    acceptAllAICode={acceptAllAICode}
                    rejectAllAICode={rejectAllAICode}
                    getReviewProgress={getReviewProgress}
                    agentReviewStatus={agentReviewStatus}
                    setAgentReviewStatus={setAgentReviewStatus}
                />
            )}
            {/* Revert questionnaire - shows when user clicks revert button */}
            {showRevertQuestionnaire && (
                <RevertQuestionnaire
                    onDestroy={() => setShowRevertQuestionnaire(false)}
                    getDuplicateChatHistoryManager={getDuplicateChatHistoryManager}
                    setChatHistoryManager={setChatHistoryManager}
                />
            )}
        </>
    );
};

export default AgentReviewPanel;

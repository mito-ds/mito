/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import AgentChangeControls from '../ChatMessage/AgentChangeControls';
import RevertQuestionnaire from '../ChatMessage/RevertQuestionnaire';
import { ChatHistoryManager } from '../ChatHistoryManager';
import { AgentReviewStatus } from '../ChatTaskpane';
import { AgentReviewChangeCounts } from '../hooks/useAgentReview';

interface AgentReviewPanelProps {
    // Agent review state
    hasCheckpoint: boolean;
    agentModeEnabled: boolean;
    agentExecutionStatus: 'working' | 'stopping' | 'idle';
    displayOptimizedChatHistoryLength: number;
    showRevertQuestionnaire: boolean;
    agentReviewStatus: AgentReviewStatus;
    setAgentReviewStatus: (status: AgentReviewStatus) => void;

    // Agent review functions
    reviewAgentChanges: () => void;
    acceptAllAICode: () => void;
    rejectAllAICode: () => void;
    getChangeCounts: () => AgentReviewChangeCounts;
    getReviewProgress: () => { reviewed: number; total: number };
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
    displayOptimizedChatHistoryLength,
    showRevertQuestionnaire,
    reviewAgentChanges,
    acceptAllAICode,
    rejectAllAICode,
    getChangeCounts,
    getReviewProgress,
    setHasCheckpoint,
    setDisplayedNextStepsIfAvailable,
    setShowRevertQuestionnaire,
    getDuplicateChatHistoryManager,
    setChatHistoryManager,
    app,
    notebookTracker,
    chatTaskpaneMessagesRef
}) => {
    return (
        <>
            {/* Agent restore button - shows after agent completes and when agent checkpoint exists */}
            {hasCheckpoint &&
                agentModeEnabled &&
                agentExecutionStatus === 'idle' &&
                displayOptimizedChatHistoryLength > 0 && (
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
                        getChangeCounts={getChangeCounts}
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

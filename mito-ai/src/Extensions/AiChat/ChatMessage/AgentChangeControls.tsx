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

interface IAgentChangeControlsProps {
    reviewAgentChanges: () => void;
    app: JupyterFrontEnd;
    notebookTracker: INotebookTracker;
    setHasCheckpoint: (value: boolean) => void;
    setDisplayedNextStepsIfAvailable: (value: boolean) => void;
    setShowRevertQuestionnaire: (value: boolean) => void;
    chatMessagesRef: React.RefObject<HTMLDivElement>;
    acceptAllAICode: () => void;
    rejectAllAICode: () => void;
}

const AgentChangeControls: React.FC<IAgentChangeControlsProps> = ({
    reviewAgentChanges,
    app,
    notebookTracker,
    setHasCheckpoint,
    setDisplayedNextStepsIfAvailable,
    setShowRevertQuestionnaire,
    chatMessagesRef,
    acceptAllAICode,
    rejectAllAICode,
}) => {

    const [reviewStatus, setReviewStatus] = useState<'pre-review' | 'reviewing' | 'post-review'>('pre-review');

    const handleReviewChanges = (): void => {
        setReviewStatus('reviewing');
        reviewAgentChanges();
    }

    const handleAcceptAll = (): void => {
        acceptAllAICode();
        setReviewStatus('post-review');
    }

    const handleRejectAll = (): void => {
        rejectAllAICode();
        setReviewStatus('post-review');
    }

    const handleUndoAll = async (): Promise<void> => {
        await restoreCheckpoint(app, notebookTracker, setHasCheckpoint);
        setDisplayedNextStepsIfAvailable(false);
        setHasCheckpoint(false);
        setReviewStatus('post-review');
        setShowRevertQuestionnaire(true);
        scrollToDiv(chatMessagesRef);
    }

    if (reviewStatus === 'pre-review') {
        return (
            <div className='message message-assistant-chat'>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                        className="button-base button-gray"
                        onClick={handleReviewChanges}
                    >
                        Review Changes
                    </button>
                    <TextAndIconButton
                        text="Undo All"
                        icon={UndoIcon}
                        title="Undo All"
                        onClick={handleUndoAll}
                        variant="gray"
                        width="fit-contents"
                        iconPosition="left"
                    />
                </div>
            </div>
        )
    }

    if (reviewStatus === 'reviewing') {
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

    if (reviewStatus === 'post-review') {
        return (
            <div className='message message-assistant-chat'>
                <TextAndIconButton
                    text="Undo All"
                    icon={UndoIcon}
                    title="Undo All"
                    onClick={handleUndoAll}
                    variant="gray"
                    width="fit-contents"
                    iconPosition="left"
                />
            </div>
        )
    }   

    return null;
};

export default AgentChangeControls;


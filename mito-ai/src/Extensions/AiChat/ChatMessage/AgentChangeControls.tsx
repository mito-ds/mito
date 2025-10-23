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
}) => {

    const [isReviewing, setIsReviewing] = useState(false);

    const handleAcceptAll = (): void => {
        acceptAllAICode();
        setIsReviewing(false);
    }

    const handleReviewChanges = (): void => {
        setIsReviewing(true);
        reviewAgentChanges();
    }

    const handleUndoAll = async (): Promise<void> => {
        await restoreCheckpoint(app, notebookTracker, setHasCheckpoint);
        setDisplayedNextStepsIfAvailable(false);
        setHasCheckpoint(false);
        setShowRevertQuestionnaire(true);
        scrollToDiv(chatMessagesRef);
    }

    return (
        <div className='message message-assistant-chat'>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isReviewing ? (
                    <button
                        className="button-base button-green"
                        title="Accept all changes"
                        onClick={handleAcceptAll}
                    >
                        Accept all
                    </button>
                ) : (
                    <button
                        className="button-base button-gray"
                        onClick={handleReviewChanges}
                    >
                        Review Changes
                    </button>
                )}
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
    );
};

export default AgentChangeControls;


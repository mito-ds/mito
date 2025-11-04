/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useRef } from 'react';
import { Compartment } from '@codemirror/state';
import OpenAI from 'openai';
import { INotebookTracker } from '@jupyterlab/notebook';
import { ChatHistoryManager } from '../ChatHistoryManager';
import { CodeReviewStatus } from './useChatState';
import { ICellStateBeforeDiff, UnifiedDiffLine } from '../../../utils/codeDiff';
import {
    getCellByID,
    getCellCodeByID,
    getActiveCellID,
    setActiveCellByID,
    writeCodeToCellByID,
    highlightCodeCell,
    scrollToCell,
} from '../../../utils/notebook';
import { getCodeBlockFromMessage, removeMarkdownCodeFormatting } from '../../../utils/strings';
import { getCodeDiffsAndUnifiedCodeString } from '../../../utils/codeDiff';
import { codeDiffStripesExtension } from '../CodeDiffDisplay';
import { applyCellEditorExtension } from '../../../utils/notebook';

interface UseCodeReviewProps {
    notebookTracker: INotebookTracker;
    chatHistoryManagerRef: React.MutableRefObject<ChatHistoryManager>;
    setCodeReviewStatus: (status: CodeReviewStatus) => void;
    updateCellToolbarButtons: () => void;
    agentReview: {
        hasUnreviewedChanges: (cellId: string) => boolean;
        acceptAICodeInAgentMode: () => void;
        rejectAICodeInAgentMode: () => void;
    };
    codeDiffStripesCompartments: React.MutableRefObject<Map<string, Compartment>>;
}

/**
 * Hook to manage code review and diff logic in the chat taskpane.
 * 
 * Manages:
 * - cellStateBeforeDiff: Ref to store the original cell state before applying diffs
 * - codeDiffStripesCompartments: Ref to store CodeMirror compartments for diff stripes
 * - previewAICodeToActiveCell: Function to preview AI code in the active cell
 * - acceptAICode: Function to accept AI code (unified for both chat and agent modes)
 * - rejectAICode: Function to reject AI code (unified for both chat and agent modes)
 * - updateCodeDiffStripes: Function to update code diff stripes on a cell
 * - writeCodeToCellAndTurnOffDiffs: Function to write code to a cell and remove diffs
 * - updateCodeCellsExtensions: Function to update CodeMirror extensions for diff display
 */
export const useCodeReview = ({
    notebookTracker,
    chatHistoryManagerRef,
    setCodeReviewStatus,
    updateCellToolbarButtons,
    agentReview,
    codeDiffStripesCompartments,
}: UseCodeReviewProps): {
    cellStateBeforeDiff: React.MutableRefObject<ICellStateBeforeDiff | undefined>;
    previewAICodeToActiveCell: () => void;
    acceptAICode: () => void;
    rejectAICode: () => void;
    updateCodeDiffStripes: (aiMessage: OpenAI.ChatCompletionMessageParam | undefined, updateCellID: string) => void;
    writeCodeToCellAndTurnOffDiffs: (code: string, codeCellID: string | undefined) => void;
    updateCodeCellsExtensions: (unifiedDiffLines: UnifiedDiffLine[] | undefined) => void;
} => {
    // Store the original cell before diff so that we can revert to it if the user rejects the AI's code
    const cellStateBeforeDiff = useRef<ICellStateBeforeDiff | undefined>(undefined);

    const updateCodeDiffStripes = (aiMessage: OpenAI.ChatCompletionMessageParam | undefined, updateCellID: string): void => {
        if (!aiMessage) {
            return;
        }

        const updateCellCode = getCellCodeByID(notebookTracker, updateCellID);

        if (updateCellID === undefined || updateCellCode === undefined) {
            return;
        }

        // Extract the code from the AI's message and then calculate the code diffs
        const aiGeneratedCode = getCodeBlockFromMessage(aiMessage);
        const aiGeneratedCodeCleaned = removeMarkdownCodeFormatting(aiGeneratedCode || '');
        const { unifiedCodeString, unifiedDiffs } = getCodeDiffsAndUnifiedCodeString(updateCellCode, aiGeneratedCodeCleaned);

        // Store the code cell ID where we write the code diffs so that we can
        // accept or reject the code diffs to the correct cell
        cellStateBeforeDiff.current = { codeCellID: updateCellID, code: updateCellCode };

        // Temporarily write the unified code string to the active cell so we can display
        // the code diffs to the user
        writeCodeToCellByID(notebookTracker, unifiedCodeString, updateCellID);
        updateCodeCellsExtensions(unifiedDiffs);

        // Briefly highlight the code cell to draw the user's attention to it
        highlightCodeCell(notebookTracker, updateCellID);
    };

    const updateCodeCellsExtensions = (unifiedDiffLines: UnifiedDiffLine[] | undefined): void => {
        const notebookPanel = notebookTracker.currentWidget;
        const notebook = notebookPanel?.content;
        if (!notebook) {
            return;
        }

        const activeCellIndex = notebook.activeCellIndex;

        notebook.widgets.forEach((cell, index) => {
            if (cell.model.type === 'code') {
                const isActiveCodeCell = activeCellIndex === index;
                const cellId = cell.model.id;

                // Only apply diff stripes to the active cell
                const extension = unifiedDiffLines !== undefined && isActiveCodeCell
                    ? codeDiffStripesExtension({ unifiedDiffLines: unifiedDiffLines })
                    : [];

                applyCellEditorExtension(notebookPanel, cellId, extension, codeDiffStripesCompartments.current);
            }
        });
    };

    const writeCodeToCellAndTurnOffDiffs = (code: string, codeCellID: string | undefined): void => {
        updateCodeCellsExtensions(undefined);
        cellStateBeforeDiff.current = undefined;

        if (codeCellID !== undefined) {
            writeCodeToCellByID(notebookTracker, code, codeCellID);
            updateCellToolbarButtons();
        }
    };

    const previewAICodeToActiveCell = (): void => {
        setCodeReviewStatus('codeCellPreview');

        const activeCellID = getActiveCellID(notebookTracker);
        const lastAIDisplayMessage = chatHistoryManagerRef.current.getLastAIDisplayOptimizedChatItem();

        if (activeCellID === undefined || lastAIDisplayMessage === undefined) {
            return;
        }

        scrollToCell(notebookTracker.currentWidget, activeCellID, undefined, 'end');
        updateCodeDiffStripes(lastAIDisplayMessage.message, activeCellID);
        updateCellToolbarButtons();
    };

    const acceptAICodeInChatMode = (): void => {
        const latestChatHistoryManager = chatHistoryManagerRef.current;
        const lastAIMessage = latestChatHistoryManager.getLastAIDisplayOptimizedChatItem();

        if (!lastAIMessage || !cellStateBeforeDiff.current) {
            return;
        }

        const aiGeneratedCode = getCodeBlockFromMessage(lastAIMessage.message);
        if (!aiGeneratedCode) {
            return;
        }

        setCodeReviewStatus('applied');

        const targetCellID = cellStateBeforeDiff.current.codeCellID;
        // Write to the cell that has the code diffs
        writeCodeToCellAndTurnOffDiffs(aiGeneratedCode, targetCellID);

        // Focus on the active cell after the code is written
        const targetCell = getCellByID(notebookTracker, targetCellID);
        if (targetCell) {
            // Make the target cell the active cell
            setActiveCellByID(notebookTracker, targetCellID);
            // Focus on the active cell
            targetCell.activate();
        }
    };

    const acceptAICode = (): void => {
        const activeCellId = notebookTracker.activeCell?.model.id;

        // Determine mode based on whether the active cell has unreviewed changes in agent review mode
        if (activeCellId && agentReview.hasUnreviewedChanges(activeCellId)) {
            agentReview.acceptAICodeInAgentMode();
        } else {
            acceptAICodeInChatMode();
        }
    };

    const rejectAICodeInChatMode = (): void => {
        if (cellStateBeforeDiff.current === undefined) {
            return;
        }

        setCodeReviewStatus('chatPreview');

        writeCodeToCellAndTurnOffDiffs(cellStateBeforeDiff.current.code, cellStateBeforeDiff.current.codeCellID);
    };

    const rejectAICode = (): void => {
        const activeCellId = notebookTracker.activeCell?.model.id;

        // Determine mode based on whether the active cell has unreviewed changes in agent review mode
        if (activeCellId && agentReview.hasUnreviewedChanges(activeCellId)) {
            agentReview.rejectAICodeInAgentMode();
        } else {
            rejectAICodeInChatMode();
        }
    };

    return {
        cellStateBeforeDiff,
        previewAICodeToActiveCell,
        acceptAICode,
        rejectAICode,
        updateCodeDiffStripes,
        writeCodeToCellAndTurnOffDiffs,
        updateCodeCellsExtensions,
    };
};


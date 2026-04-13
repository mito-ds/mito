/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { CodeCell } from '@jupyterlab/cells';
import { NotebookPanel } from '@jupyterlab/notebook';
import { IContextManager } from '../../ContextManager/ContextManagerPlugin';
import type { Variable } from '../../ContextManager/VariableInspector';
import { getFullErrorMessageFromTraceback } from '../../ErrorMimeRenderer/errorUtils';
import { LoadingStatus } from './useChatState';
import { acceptAndRunCellUpdate, runAllCells } from '../../../utils/agentActions';
import { checkForBlacklistedWords } from '../../../utils/blacklistedWords';
import { getCellOutputByIDInNotebook } from '../../../utils/cellOutput';
import { didCellExecutionError, getAIOptimizedCellsInNotebookPanel, getActiveCellIDInNotebookPanel } from '../../../utils/notebook';
import { executeScratchpadCode, formatScratchpadResult } from '../../../utils/scratchpadExecution';
import { AgentResponse, AIOptimizedCell } from '../../../websockets/completions/CompletionModels';
import { ChatHistoryManager } from '../ChatHistoryManager';

export interface IAgentToolExecutionResult {
    success: boolean;
    toolType: AgentResponse['type'];
    errorMessage?: string;
    cells?: AIOptimizedCell[];
    variables?: Variable[];
    output?: string;
    activeCellId?: string;
    shouldStopAgent?: boolean;
}

interface IAgentToolExecutorProps {
    agentResponse: AgentResponse;
    app: JupyterFrontEnd;
    notebookPanel: NotebookPanel;
    contextManager: IContextManager;
    setLoadingStatus: (status: LoadingStatus) => void;
    addAIMessageFromResponseAndUpdateState: (
        messageContent: string,
        promptType: any,
        chatHistoryManager: ChatHistoryManager,
        mitoAIConnectionError?: boolean,
        mitoAIConnectionErrorType?: string | null
    ) => void;
    chatHistoryManagerRef: React.MutableRefObject<ChatHistoryManager>;
}

const unsupportedFrontendToolResult = (toolType: AgentResponse['type']): IAgentToolExecutionResult => {
    return {
        success: true,
        toolType,
        output: `No frontend action required for tool type: ${toolType}`,
    };
};

export const executeAgentTool = async ({
    agentResponse,
    app,
    notebookPanel,
    contextManager,
    setLoadingStatus,
    addAIMessageFromResponseAndUpdateState,
    chatHistoryManagerRef,
}: IAgentToolExecutorProps): Promise<IAgentToolExecutionResult> => {
    switch (agentResponse.type) {
        case 'cell_update': {
            if (!agentResponse.cell_update) {
                return {
                    success: false,
                    errorMessage: 'cell_update payload is missing',
                    toolType: 'cell_update',
                };
            }

            const securityCheck = checkForBlacklistedWords(agentResponse.cell_update.code);
            if (!securityCheck.safe) {
                console.error('Security Warning:', securityCheck.reason);
                addAIMessageFromResponseAndUpdateState(
                    `I cannot automatically execute this code because it did not pass my security checks. ${securityCheck.reason}. If you decide that this code is safe, you can manually run it.`,
                    'agent:execution',
                    chatHistoryManagerRef.current
                );
                return {
                    success: false,
                    errorMessage: `Security check failed: ${securityCheck.reason}`,
                    toolType: 'cell_update',
                };
            }

            setLoadingStatus('running-code');
            try {
                await acceptAndRunCellUpdate(agentResponse.cell_update, notebookPanel);
            } finally {
                setLoadingStatus(undefined);
            }

            const cells = getAIOptimizedCellsInNotebookPanel(notebookPanel);
            const activeCellId = getActiveCellIDInNotebookPanel(notebookPanel);
            const variables = contextManager.getNotebookContext(notebookPanel.id)?.variables;
            const activeCell = notebookPanel.content.activeCell;
            if (activeCell && activeCell.model.type === 'code') {
                const codeCell = activeCell as CodeCell;
                if (didCellExecutionError(codeCell)) {
                    const errorOutput = codeCell.model.outputs?.toJSON().find(output => output.output_type === 'error');
                    const traceback = errorOutput?.traceback as string[] | undefined;
                    const errorMessage = traceback && traceback.length > 0
                        ? getFullErrorMessageFromTraceback(traceback)
                        : 'Code cell execution failed with an unknown error.';

                    return {
                        success: false,
                        errorMessage,
                        cells,
                        toolType: 'cell_update',
                        activeCellId,
                    };
                }
            }

            return {
                success: true,
                cells,
                toolType: 'cell_update',
                activeCellId,
                variables,
            };
        }
        case 'run_all_cells': {
            setLoadingStatus('running-code');
            let result;
            try {
                result = await runAllCells(app, notebookPanel);
            } finally {
                setLoadingStatus(undefined);
            }

            const cells = getAIOptimizedCellsInNotebookPanel(notebookPanel);
            const variables = contextManager.getNotebookContext(notebookPanel.id)?.variables;
            if (!result.success && result.errorMessage) {
                return {
                    success: false,
                    errorMessage: result.errorMessage,
                    cells,
                    toolType: 'run_all_cells',
                };
            }

            return {
                success: true,
                cells,
                toolType: 'run_all_cells',
                variables,
            };
        }
        case 'get_cell_output': {
            const cellId = agentResponse.get_cell_output_cell_id;
            if (!cellId) {
                return {
                    success: false,
                    errorMessage: 'get_cell_output_cell_id is missing',
                    toolType: 'get_cell_output',
                };
            }

            const output = await getCellOutputByIDInNotebook(notebookPanel, cellId);
            return {
                success: true,
                output: output ?? undefined,
                toolType: 'get_cell_output',
            };
        }
        case 'scratchpad': {
            const code = agentResponse.scratchpad_code;
            if (!code) {
                return {
                    success: false,
                    errorMessage: 'scratchpad_code is missing',
                    toolType: 'scratchpad',
                };
            }

            const scratchpadSecurityCheck = checkForBlacklistedWords(code);
            if (!scratchpadSecurityCheck.safe) {
                console.error('Security Warning:', scratchpadSecurityCheck.reason);
                return {
                    success: false,
                    errorMessage: `Security check failed: ${scratchpadSecurityCheck.reason}`,
                    toolType: 'scratchpad',
                };
            }

            setLoadingStatus('running-code');
            let scratchpadResult;
            try {
                scratchpadResult = await executeScratchpadCode(notebookPanel, code);
            } finally {
                setLoadingStatus(undefined);
            }

            const formattedResult = formatScratchpadResult(scratchpadResult);
            return {
                success: scratchpadResult.success,
                output: formattedResult,
                errorMessage: scratchpadResult.error,
                toolType: 'scratchpad',
            };
        }
        case 'ask_user_question': {
            return {
                success: true,
                output: 'Question delivered to user',
                toolType: 'ask_user_question',
                shouldStopAgent: true,
            };
        }
        case 'create_streamlit_app':
        case 'edit_streamlit_app':
        case 'finished_task':
        default:
            return unsupportedFrontendToolResult(agentResponse.type);
    }
};

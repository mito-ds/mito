/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { NotebookPanel } from '@jupyterlab/notebook';
import { KernelMessage } from '@jupyterlab/services';
import { getFullErrorMessageFromTraceback } from '../Extensions/ErrorMimeRenderer/errorUtils';

export type ScratchpadResult = {
    success: boolean;
    stdout: string;
    stderr: string;
    error?: string;
    traceback?: string;
}

/**
 * Executes Python code silently in the kernel and captures the output.
 * This is used for scratchpad exploration work that shouldn't leave code in the notebook.
 * 
 * @param notebookPanel - The notebook panel containing the kernel
 * @param code - The Python code to execute
 * @returns Promise resolving to the execution result with stdout, stderr, and any errors
 */
export async function executeScratchpadCode(
    notebookPanel: NotebookPanel,
    code: string
): Promise<ScratchpadResult> {
    const kernel = notebookPanel.context.sessionContext.session?.kernel;

    if (!kernel) {
        return {
            success: false,
            stdout: '',
            stderr: '',
            error: 'No kernel available'
        };
    }

    return new Promise<ScratchpadResult>((resolve) => {
        let stdout = '';
        let stderr = '';
        let errorMessage: string | undefined = undefined;
        let traceback: string | undefined = undefined;
        let hasError = false;

        // Request the kernel to execute the code silently
        const future = kernel.requestExecute({
            code: code,
            // Adding silent: true prevents an execute_input message from being sent
            silent: true
        });

        // Listen for output from the kernel
        future.onIOPub = (msg: KernelMessage.IMessage) => {
            // Handle stream messages (stdout/stderr)
            if (KernelMessage.isStreamMsg(msg)) {
                if (msg.content.name === 'stdout') {
                    // Accumulate stdout output (may come in chunks)
                    stdout += msg.content.text;
                } else if (msg.content.name === 'stderr') {
                    // Accumulate stderr output (may come in chunks)
                    stderr += msg.content.text;
                }
            }
            // Handle error messages
            else if (msg.header.msg_type === 'error') {
                hasError = true;
                const errorContent = msg.content as KernelMessage.IErrorMsg['content'];
                errorMessage = errorContent.ename + ': ' + errorContent.evalue;
                
                // Extract traceback if available
                if (errorContent.traceback && Array.isArray(errorContent.traceback)) {
                    traceback = getFullErrorMessageFromTraceback(errorContent.traceback);
                } else if (errorContent.traceback) {
                    traceback = String(errorContent.traceback);
                }
            }
        };

        // Handle execution completion
        future.done.then(() => {
            resolve({
                success: !hasError,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                error: errorMessage,
                traceback: traceback
            });
        }).catch((error) => {
            // Handle execution failure
            resolve({
                success: false,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                error: error.message || 'Execution failed',
                traceback: error.stack
            });
        });
    });
}

/**
 * Formats a scratchpad execution result into a string message for the agent.
 * Handles both success and error cases, formatting stdout, stderr, errors, and tracebacks.
 * 
 * @param scratchpadResult - The result from executing scratchpad code
 * @returns Formatted string message containing the execution results
 */
export function formatScratchpadResult(scratchpadResult: ScratchpadResult): string {
    let resultMessage = '';
    
    if (scratchpadResult.success) {
        if (scratchpadResult.stdout) {
            resultMessage += scratchpadResult.stdout;
        }
        if (scratchpadResult.stderr) {
            resultMessage += (resultMessage ? '\n' : '') + `[stderr]\n${scratchpadResult.stderr}`;
        }
    } else {
        resultMessage += '[Execution Error]\n';
        if (scratchpadResult.error) {
            resultMessage += `${scratchpadResult.error}\n`;
        }
        if (scratchpadResult.traceback) {
            resultMessage += `\n${scratchpadResult.traceback}`;
        }
        if (scratchpadResult.stdout) {
            resultMessage += `\n[stdout before error]\n${scratchpadResult.stdout}`;
        }
        if (scratchpadResult.stderr) {
            resultMessage += `\n[stderr]\n${scratchpadResult.stderr}`;
        }
    }
    
    return resultMessage;
}

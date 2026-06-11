/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ICellModel } from '@jupyterlab/cells';
import { VerifiedSnippetRef } from '../websockets/completions/CompletionModels';

export const MITO_VERIFIED_SNIPPET_METADATA_KEY = 'mito-verified-snippet';

export interface IVerifiedSnippetMetadata {
    reportName: string;
    snippetId: string;
    startLine: number;
    endLine: number;
}

export const setVerifiedSnippetMetadata = (
    cellModel: ICellModel,
    ref: VerifiedSnippetRef,
): void => {
    cellModel.setMetadata(MITO_VERIFIED_SNIPPET_METADATA_KEY, {
        reportName: ref.report_name,
        snippetId: ref.snippet_id,
        startLine: ref.start_line,
        endLine: ref.end_line,
    });
};

export const getVerifiedSnippetMetadata = (
    cellModel: ICellModel,
): IVerifiedSnippetMetadata | undefined => {
    if (!Object.prototype.hasOwnProperty.call(cellModel.metadata, MITO_VERIFIED_SNIPPET_METADATA_KEY)) {
        return undefined;
    }
    const metadata = cellModel.getMetadata(MITO_VERIFIED_SNIPPET_METADATA_KEY) as IVerifiedSnippetMetadata;
    if (!metadata?.reportName || !metadata?.snippetId) {
        return undefined;
    }
    return metadata;
};

// Matches the same citation format the agent uses in chat messages,
// e.g. [MITO_VERIFIED_SNIPPET:retention-report:abc123]
const VERIFIED_SNIPPET_CITATION_REGEX = /\[MITO_VERIFIED_SNIPPET:([^:]+):([^\]]+)\]/;

export const parseVerifiedSnippetCitation = (
    message: string,
): { reportName: string; snippetId: string } | undefined => {
    const match = message.match(VERIFIED_SNIPPET_CITATION_REGEX);
    if (!match || !match[1] || !match[2]) {
        return undefined;
    }
    return { reportName: match[1].trim(), snippetId: match[2].trim() };
};

/**
 * Find the 0-indexed line range of the snippet's code within the cell's code.
 * Lines are compared after trimming so indentation/whitespace differences
 * don't prevent a match. If the snippet can't be located, defaults to the
 * whole cell.
 */
export const findSnippetLineRange = (
    cellCode: string,
    snippetCode: string,
): { startLine: number; endLine: number } => {
    const cellLines = cellCode.split('\n').map(line => line.trim());
    const snippetLines = snippetCode.split('\n').map(line => line.trim()).filter(line => line !== '');

    if (snippetLines.length > 0) {
        for (let i = 0; i < cellLines.length; i++) {
            if (cellLines[i] !== snippetLines[0]) {
                continue;
            }
            let cellIdx = i;
            let matched = true;
            for (const snippetLine of snippetLines) {
                // Skip blank lines in the cell so the agent adding spacing doesn't break the match.
                while (cellIdx < cellLines.length && cellLines[cellIdx] === '') {
                    cellIdx++;
                }
                if (cellIdx >= cellLines.length || cellLines[cellIdx] !== snippetLine) {
                    matched = false;
                    break;
                }
                cellIdx++;
            }
            if (matched) {
                return { startLine: i, endLine: cellIdx - 1 };
            }
        }
    }

    return { startLine: 0, endLine: Math.max(0, cellLines.length - 1) };
};

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

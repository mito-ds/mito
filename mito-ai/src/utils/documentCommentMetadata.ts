/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { ICellModel } from '@jupyterlab/cells';

export const MITO_DOCUMENT_COMMENTS_METADATA_KEY = 'mito-document-comments';

export type DocumentCommentResponseStatus = 'loading' | 'streaming' | 'done' | 'error';

/**
 * A Google Docs-style comment thread anchored to a cell. Stored as an array
 * on the cell's metadata so threads live with the notebook file.
 */
export interface IDocumentCommentThread {
    id: string;
    type: 'code' | 'output';
    cellId: string;
    cellNumber: number;
    startLine?: number;
    endLine?: number;
    selectedCode?: string;
    comment: string;
    response: string;
    responseStatus: DocumentCommentResponseStatus;
    responseError?: string;
}

export const getDocumentCommentThreads = (cellModel: ICellModel): IDocumentCommentThread[] => {
    if (!Object.prototype.hasOwnProperty.call(cellModel.metadata, MITO_DOCUMENT_COMMENTS_METADATA_KEY)) {
        return [];
    }
    const threads = cellModel.getMetadata(MITO_DOCUMENT_COMMENTS_METADATA_KEY) as IDocumentCommentThread[];
    return Array.isArray(threads) ? threads : [];
};

export const addDocumentCommentThread = (cellModel: ICellModel, thread: IDocumentCommentThread): void => {
    const threads = getDocumentCommentThreads(cellModel);
    cellModel.setMetadata(MITO_DOCUMENT_COMMENTS_METADATA_KEY, [...threads, thread]);
};

export const updateDocumentCommentThread = (
    cellModel: ICellModel,
    threadId: string,
    updates: Partial<IDocumentCommentThread>,
): void => {
    const threads = getDocumentCommentThreads(cellModel);
    cellModel.setMetadata(
        MITO_DOCUMENT_COMMENTS_METADATA_KEY,
        threads.map(thread => thread.id === threadId ? { ...thread, ...updates } : thread),
    );
};

export const removeDocumentCommentThread = (cellModel: ICellModel, threadId: string): void => {
    const threads = getDocumentCommentThreads(cellModel).filter(thread => thread.id !== threadId);
    if (threads.length === 0) {
        cellModel.deleteMetadata(MITO_DOCUMENT_COMMENTS_METADATA_KEY);
    } else {
        cellModel.setMetadata(MITO_DOCUMENT_COMMENTS_METADATA_KEY, threads);
    }
};

/**
 * Threads whose responses were still streaming when the notebook closed can
 * never finish, so mark them as errored when the notebook is reopened.
 */
export const normalizeInterruptedThreads = (cellModel: ICellModel): void => {
    const threads = getDocumentCommentThreads(cellModel);
    if (!threads.some(thread => thread.responseStatus === 'loading' || thread.responseStatus === 'streaming')) {
        return;
    }
    cellModel.setMetadata(
        MITO_DOCUMENT_COMMENTS_METADATA_KEY,
        threads.map(thread =>
            thread.responseStatus === 'loading' || thread.responseStatus === 'streaming'
                ? { ...thread, responseStatus: 'error' as const, responseError: 'The response was interrupted. Resolve this comment and ask again.' }
                : thread
        ),
    );
};

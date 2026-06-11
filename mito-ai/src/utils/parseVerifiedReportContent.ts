/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export interface IParsedVerifiedReportSnippet {
    index: number;
    id: string;
    comment?: string;
    aiContext?: string;
    code: string;
}

export interface IParsedVerifiedReportContent {
    reportName?: string;
    description?: string;
    snippets: IParsedVerifiedReportSnippet[];
    rawFallback?: string;
}

const parseSnippetBody = (
    index: number,
    id: string,
    body: string
): IParsedVerifiedReportSnippet => {
    const lines = body.split('\n');
    let comment: string | undefined;
    let aiContext: string | undefined;
    let codeStartIndex = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        if (line.startsWith('User comment: ')) {
            comment = line.slice('User comment: '.length);
        } else if (line.startsWith('Context: ')) {
            aiContext = line.slice('Context: '.length);
        } else if (line === 'Code:') {
            codeStartIndex = i + 1;
            break;
        }
    }

    const code = codeStartIndex >= 0 ? lines.slice(codeStartIndex).join('\n').trim() : '';

    return { index, id, comment, aiContext, code };
};

export const parseVerifiedReportContent = (content: string): IParsedVerifiedReportContent => {
    const result: IParsedVerifiedReportContent = { snippets: [] };
    const trimmed = content.trim();
    if (!trimmed) {
        return result;
    }

    const snippetParts = trimmed.split(/\n?--- Snippet /);
    const preamble = snippetParts.shift() ?? '';

    const reportMatch = preamble.match(/^Report: (.+?)(?:\n|$)/m);
    if (reportMatch?.[1]) {
        result.reportName = reportMatch[1].trim();
    }

    const descMatch = preamble.match(/Description: ([\s\S]*?)(?:\n\n|$)/);
    if (descMatch?.[1]) {
        result.description = descMatch[1].trim();
    }

    if (preamble.includes('No snippets in this report.')) {
        return result;
    }

    for (const part of snippetParts) {
        const headerMatch = part.match(/^(\d+) \(id: ([^)]+)\) ---\n([\s\S]*)$/);
        if (!headerMatch) {
            continue;
        }

        const [, indexStr = '', id = '', body = ''] = headerMatch;
        result.snippets.push(parseSnippetBody(parseInt(indexStr, 10), id, body));
    }

    if (result.snippets.length === 0 && !result.description && !result.reportName) {
        result.rawFallback = trimmed;
    }

    return result;
};

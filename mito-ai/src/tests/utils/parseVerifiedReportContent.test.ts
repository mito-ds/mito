/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { parseVerifiedReportContent } from '../../utils/parseVerifiedReportContent';

describe('parseVerifiedReportContent', () => {
    test('parses report description and snippets with code', () => {
        const content = [
            'Report: retention-report',
            '',
            'Description: Standard retention calculation.',
            '',
            '--- Snippet 1 (id: abc-123) ---',
            'User comment: Use this for quarterly retention.',
            'Context: Requires start_customers and end_customers.',
            'Code:',
            'retained = start & end',
            'retention_rate = len(retained) / len(start)',
            '',
        ].join('\n');

        const parsed = parseVerifiedReportContent(content);

        expect(parsed.reportName).toBe('retention-report');
        expect(parsed.description).toBe('Standard retention calculation.');
        expect(parsed.snippets).toHaveLength(1);
        expect(parsed.snippets[0]).toEqual({
            index: 1,
            id: 'abc-123',
            comment: 'Use this for quarterly retention.',
            aiContext: 'Requires start_customers and end_customers.',
            code: 'retained = start & end\nretention_rate = len(retained) / len(start)',
        });
    });

    test('handles reports with no snippets', () => {
        const content = [
            'Report: empty-report',
            '',
            'Description: No snippets yet.',
            '',
            'No snippets in this report.',
        ].join('\n');

        const parsed = parseVerifiedReportContent(content);

        expect(parsed.reportName).toBe('empty-report');
        expect(parsed.description).toBe('No snippets yet.');
        expect(parsed.snippets).toHaveLength(0);
        expect(parsed.rawFallback).toBeUndefined();
    });
});

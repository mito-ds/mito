/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { GraphType } from './GraphSetupTab';

const GRAPH_TYPE_ALIASES: [string, GraphType][] = [
    ['bar', GraphType.BAR],
    ['line', GraphType.LINE],
    ['scatter', GraphType.SCATTER],
    ['histogram', GraphType.HISTOGRAM],
    ['hist', GraphType.HISTOGRAM],
    ['density heatmap', GraphType.DENSITY_HEATMAP],
    ['heatmap', GraphType.DENSITY_HEATMAP],
    ['density contour', GraphType.DENSITY_CONTOUR],
    ['contour', GraphType.DENSITY_CONTOUR],
    ['box', GraphType.BOX],
    ['box plot', GraphType.BOX],
    ['violin', GraphType.VIOLIN],
    ['strip', GraphType.STRIP],
    ['ecdf', GraphType.ECDF],
];

export const parseGraphTypeFromAISuggestion = (raw: string): GraphType | undefined => {
    const n = raw.trim().toLowerCase().replace(/_/g, ' ');
    for (const [key, graphType] of GRAPH_TYPE_ALIASES) {
        if (n === key) {
            return graphType;
        }
    }
    return undefined;
};

export const parseChartSuggestionsCompletion = (
    completion: string
): { graphType: GraphType; reason: string }[] | undefined => {
    let text = completion.trim();
    const fence = text.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
    if (fence) {
        text = fence[1].trim();
    }
    const arrayStart = text.indexOf('[');
    const arrayEnd = text.lastIndexOf(']');
    if (arrayStart === -1 || arrayEnd === -1 || arrayEnd <= arrayStart) {
        return undefined;
    }
    text = text.slice(arrayStart, arrayEnd + 1);

    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        return undefined;
    }
    if (!Array.isArray(parsed)) {
        return undefined;
    }

    const out: { graphType: GraphType; reason: string }[] = [];
    for (const item of parsed) {
        if (item === null || typeof item !== 'object') {
            continue;
        }
        const rec = item as Record<string, unknown>;
        const gt = rec.graph_type ?? rec.graphType;
        const reasonRaw = rec.reason ?? rec.explanation ?? '';
        if (typeof gt !== 'string' || typeof reasonRaw !== 'string') {
            continue;
        }
        const graphType = parseGraphTypeFromAISuggestion(gt);
        if (graphType === undefined) {
            continue;
        }
        const reason = reasonRaw.trim() || 'Suggested chart';
        out.push({ graphType, reason });
    }

    if (out.length === 0) {
        return undefined;
    }
    return out;
};

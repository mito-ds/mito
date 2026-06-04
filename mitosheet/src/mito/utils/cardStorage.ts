/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export type ExploreLink = {
    label: string;
    view_code: string;
}

export type ParsedCardDefinition = {
    glanceCode: string;
    code: string;
    explore: ExploreLink[];
}

export const parseCardDefinition = (stored: string): ParsedCardDefinition => {
    const stripped = stored.trim();
    if (stripped === '') {
        return { glanceCode: '', code: '', explore: [] };
    }
    try {
        const parsed = JSON.parse(stripped) as unknown;
        if (
            typeof parsed === 'object' && parsed !== null &&
            'code' in parsed && typeof (parsed as { code: unknown }).code === 'string'
        ) {
            const code = (parsed as { code: string }).code;
            const glanceRaw = 'glance_code' in parsed ? (parsed as { glance_code: unknown }).glance_code : '';
            const glanceCode = typeof glanceRaw === 'string' ? glanceRaw : '';
            const explore = 'explore' in parsed ? (parsed as { explore: unknown }).explore : [];
            if (!Array.isArray(explore)) {
                return { glanceCode, code, explore: [] };
            }
            const validExplore: ExploreLink[] = [];
            for (const item of explore) {
                if (
                    typeof item === 'object' && item !== null &&
                    'label' in item && typeof item.label === 'string' &&
                    'view_code' in item && typeof item.view_code === 'string'
                ) {
                    validExplore.push({ label: item.label, view_code: item.view_code });
                }
            }
            return { glanceCode, code, explore: validExplore };
        }
    } catch {
        // plain Streamlit code string
    }
    return { glanceCode: '', code: stripped, explore: [] };
}

export const serializeCardDefinition = (
    code: string,
    explore: ExploreLink[],
    glanceCode: string = '',
): string => {
    const glance = glanceCode.trim();
    const full = code.trim();
    const hasDistinctGlance = glance !== '' && glance !== full;
    const hasExplore = explore.length > 0;

    if (!hasDistinctGlance && !hasExplore) {
        return code;
    }

    const payload: Record<string, unknown> = { code };
    if (hasDistinctGlance) {
        payload.glance_code = glance;
    }
    if (hasExplore) {
        payload.explore = explore;
    }
    return JSON.stringify(payload);
}

export type CardContentMode = 'glance' | 'full';

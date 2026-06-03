/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export type ExploreLink = {
    label: string;
    view_code: string;
}

export const parseCardDefinition = (stored: string): { code: string, explore: ExploreLink[] } => {
    const stripped = stored.trim();
    if (stripped === '') {
        return { code: '', explore: [] };
    }
    try {
        const parsed = JSON.parse(stripped) as unknown;
        if (
            typeof parsed === 'object' && parsed !== null &&
            'code' in parsed && typeof (parsed as { code: unknown }).code === 'string'
        ) {
            const explore = 'explore' in parsed ? (parsed as { explore: unknown }).explore : [];
            if (!Array.isArray(explore)) {
                return { code: (parsed as { code: string }).code, explore: [] };
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
            return { code: (parsed as { code: string }).code, explore: validExplore };
        }
    } catch {
        // plain Streamlit code string
    }
    return { code: stripped, explore: [] };
}

export const serializeCardDefinition = (code: string, explore: ExploreLink[]): string => {
    if (explore.length === 0) {
        return code;
    }
    return JSON.stringify({ code, explore });
}

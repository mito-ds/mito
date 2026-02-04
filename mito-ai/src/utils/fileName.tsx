/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// This function checks if a given string is a valid file name.
// It returns true if the string contains only alphanumeric characters, underscores, or hyphens.
export const isValidFileName = (fileName: string): boolean => {
    return /^[a-zA-Z0-9_-]+$/.test(fileName);
};

/**
 * Converts a rule name to a valid file-name slug: spaces and other separators
 * become hyphens, invalid characters removed, multiple hyphens collapsed.
 */
export const slugifyRuleName = (name: string): string => {
    return name
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
};

export const stripFileEnding = (rule: string): string => {
    return rule.replace('.md', '');
};
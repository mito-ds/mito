/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// This function checks if a given string is a valid file name.
// It returns true if the string contains only alphanumeric characters, underscores, or hyphens.
export const isValidFileName = (fileName: string): boolean => {
    return /^[a-zA-Z0-9_-]+$/.test(fileName);
};

export const stripFileEnding = (rule: string): string => {
    return rule.replace('.md', '');
};
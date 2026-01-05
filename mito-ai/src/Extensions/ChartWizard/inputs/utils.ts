/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * Checks if a string is a valid hex color code
 */
export const isHexColor = (value: string): boolean => {
    const hexPattern = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    return hexPattern.test(value);
};

/**
 * Normalizes hex color to ensure it has a # prefix
 */
export const normalizeHexColor = (value: string): string => {
    if (value.startsWith('#')) {
        return value;
    }
    return `#${value}`;
};


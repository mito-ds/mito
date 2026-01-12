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
 * Normalizes hex color to ensure it has a # prefix and is in 6-digit format
 * Expands 3-digit hex codes (e.g., #FFF) to 6-digit format (e.g., #FFFFFF)
 * HTML color inputs require exactly 7 characters in #RRGGBB format
 */
export const normalizeHexColor = (value: string): string => {
    // Remove # if present to work with the hex digits only
    const hexDigits = value.startsWith('#') ? value.slice(1) : value;
    
    // If it's a 3-digit hex code, expand it to 6-digit format
    if (hexDigits.length === 3 && /^[0-9A-Fa-f]{3}$/.test(hexDigits)) {
        // Expand each digit: #FFF -> #FFFFFF, #abc -> #aabbcc
        const expanded = hexDigits
            .split('')
            .map(char => char + char)
            .join('');
        return `#${expanded}`;
    }
    
    // For 6-digit codes, just ensure it has the # prefix
    if (value.startsWith('#')) {
        return value;
    }
    return `#${value}`;
};


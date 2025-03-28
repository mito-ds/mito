/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

// Utilities for the Open Source version of Mito that deal with Mito Pro


const unsafeDoNotUseElsewhereHash = (str: string): number => {
    /**
     * This is a simple, NOT SECURE hash function that is just useful
     * for checking if the pro access code is correct. Don't use it
     * for anything else, doh.
     */
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

// Checks if the pro access code is correct, by comparing to the hashed value
export const checkProAccessCode = (accessCode: string): boolean => {
    return unsafeDoNotUseElsewhereHash(accessCode) == 1979576830;
}
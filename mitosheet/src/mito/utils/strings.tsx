/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/**
 * A utility that fuzzy matches strings by similarity, and returns
 * a number between [0, 1]. 0 means the strings are not similar, and
 * 1 means the strings are identical.
 * 
 * Useful for searching utilities where users input strings and might
 * be inputting typos/numbers that aren't the same
 */
export const fuzzyMatch = (stringOne: string, stringTwo: string): number => {

    // First, remove the case
    stringOne = stringOne.toLowerCase();
    stringTwo = stringTwo.toLowerCase();

    // TODO: for now, we just search for the string, the string with spaces removed
    // and the string with underscores and dashes. In the future, we can make this 
    // handle more common typos using some existing fuzzy match algorithm

    if (stringOne.includes(stringTwo)) {
        return 1;
    } 
    const possibleTypos = [
        stringTwo,
        stringTwo.replace(' ', '-'),
        stringTwo.replace(' ', '_'),
        stringTwo.replace(' ', '.'),
        stringTwo.replace(' ', ''),
        stringTwo.replace('_', ' '),
        stringTwo.replace('-', ' '),
        stringTwo.replace('.', ' '),
    ]

    // For now, we ignore commas in string one so the most common number
    // formatting does not mess up search.
    const stringOneIgnoredCharacters = [
        stringOne,
        stringOne.replace(',', '')
    ]

    for (let i = 0; i < possibleTypos.length; i++) {
        for (let j = 0; j < stringOneIgnoredCharacters.length; j++) {
            if (stringOneIgnoredCharacters[j].includes(possibleTypos[i])) {
                return 1;
            }
        }
    }
    
    return 0;
}

export const convertToStringOrUndefined = (possibleString: string | number | boolean | undefined): string | undefined => {
    return possibleString !== undefined ? possibleString.toString() : undefined
}

export function capitalizeFirstLetter(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function toTitleCase(s: string): string {
    return s.split(' ').map(capitalizeFirstLetter).join(' ');
}
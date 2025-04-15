/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */



const INVALID_CHARACTERS_IN_FILENAME = [
    '\\',
    '/',
    '<',
    '>',
    ':',
    '"',
    '|',
    '?',
    '*',
]

export const getInvalidFileNameError = (fileName: string): string | undefined => {
    let invalidFileNameWarning: string | undefined = undefined;

    INVALID_CHARACTERS_IN_FILENAME.forEach((char) => {
        if (fileName.includes(char)) {
            invalidFileNameWarning= `The File Name cannot include ${char}`
        }
    })

    return invalidFileNameWarning;
}
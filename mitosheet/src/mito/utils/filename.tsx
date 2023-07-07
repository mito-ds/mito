

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
/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export const isOnlyNumberString = (possibleNumber: string): boolean => {
    return /^\d+\.?\d*$/.test(possibleNumber);
}

// Returns True if the possibleNumber can be converted to a number. False otherwise
export const isNum = (possibleNumber: string): boolean => {
    return !isNaN(Number(possibleNumber))
}

export const convertStringToFloatOrUndefined = (possibleNumber: string | undefined): number | undefined => {
    return possibleNumber !== undefined && isNum(possibleNumber) ? parseFloat(possibleNumber) : undefined
}
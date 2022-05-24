

export const isOnlyNumberString = (possibleNumber: string): boolean => {
    return /^\d+\.?\d*$/.test(possibleNumber);
}
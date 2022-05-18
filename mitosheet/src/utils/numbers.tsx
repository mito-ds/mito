
// Returns true if a string ends in ".", ".0", ".00", ".000", ...
export const endsInZeroDecimals = (unparsedNumber: string): boolean => {
    return unparsedNumber.replace(/0/g, '').endsWith('.');
}
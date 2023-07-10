/**
 * Utilities for figuring out what type the dtype string is.
 * NOTE: these should be identical to the Python utilities in mitosheet/sheet_functions/types/utils.py
 */

export function isBoolDtype(dtype: string): boolean {
    return dtype == 'bool';
}

export function isIntDtype(dtype: string): boolean {
    return dtype.includes('int');
}

export function isFloatDtype(dtype: string): boolean {
    return dtype.includes('float');
}

export function isStringDtype(dtype: string): boolean {
    return dtype == 'object' || dtype == 'str' || dtype == 'string';

}

export function isDatetimeDtype(dtype: string): boolean {
    return dtype.includes('datetime');
}

export function isTimedeltaDtype(dtype: string): boolean {
    return dtype.includes('timedelta');
}

export function isNumberDtype(dtype: string): boolean {
    return isIntDtype(dtype) || isFloatDtype(dtype);
}
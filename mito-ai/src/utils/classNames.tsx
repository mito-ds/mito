/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/* 
    A utility for constructing a valid classnames string, you can either pass
    a string, or an object that maps a string to a boolean value, indicating if
    it should be included in the final object. 

    For example:
        classNames('abc', '123') = 'abc 123'
        classNames('abc', {'123': true}) = 'abc 123'
        classNames('abc', {'123': false}) = 'abc'
*/
export const classNames = (...args: (string | undefined | Record<string, boolean | undefined>)[]): string => {
    let finalString = '';

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        // Skip undefined arguments
        if (arg === undefined) {
            continue;
        }

        if (typeof arg === 'string') {
            finalString += arg + ' '
        } else {
            Object.entries(arg).map(([className, include]) => {
                if (include) {
                    finalString += className + ' ';
                }
            })
        }
    }

    return finalString;
}
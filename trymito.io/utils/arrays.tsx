/* 
    Utility functions for operating on arrays.
*/

/*
    Returns True iff both arrays contains all of the same values in the same order
*/
export function arraysContainSameValueAndOrder<T>(array1: T[], array2: T[]): boolean {
    if (array1.length !== array2.length) {
        return false;
    }

    for (let i=0; i<array1.length; i++) {
        if (array1[i] !== array2[i]) {
            return false;
        }
    }

    return true;
}

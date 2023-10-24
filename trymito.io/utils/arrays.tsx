/* 
    Utility functions for operating on arrays.
*/


/* 
    Returns all items in both array1 and array2, in the order
    that they appear in array1
*/
export function intersection<T>(array1: T[], array2: T[]): T[] {
    const finalArray: T[] = [];

    array1.forEach(element => {
        if (array2.indexOf(element) >= 0) {
            finalArray.push(element);
        }
    })

    return finalArray;
}   

/*
    Returns if both arrays contains all of the same values, ignoring order
*/
export function arraysContainSameValues<T>(array1: T[], array2: T[]): boolean {
    return (intersection(array1, array2).length === array1.length) && (array1.length === array2.length)
}


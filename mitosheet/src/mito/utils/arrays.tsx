/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

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


function onlyUnique<T>(value: T, index: number, self: T[]): boolean {
    return self.indexOf(value) === index;
    
}

/* 
    Helper function for deduplicating an array, which is necessary
    in the pivot taskpane so we don't send more columns than we want
    to the backend in the rows/columns section.
*/
export function getDeduplicatedArray<T>(array: T[]): T[] {
    return array.filter(onlyUnique);
}

/* 
    Shuffles an array into a random order, following from here: 
    https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
*/
export function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle
    while (currentIndex != 0) {
  
        // Pick a remaining element
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
  
        // And swap it with the current element
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

/**
 * If the value is in the array, removes it. Otherwise, adds its.
 * @param array The array to modify in place
 * @param value The value to remove if present, and add if not present
 * @returns the array, modified in place
 */
export function toggleInArray<T>(array: T[], value: T): T[] {
    const index = array.indexOf(value);

    if (index === -1) {
        array.push(value);
    } else {
        array.splice(index, 1);
    }
    return array;
}

/**
 * If the value is not in the array, adds it
 * @param array The array to modify in place
 * @param value The value to add if it is not present
 * @returns the array, modified in place
 */
export function addIfAbsent<T>(array: T[], value: T): T[] {
    const index = array.indexOf(value);

    if (index === -1) {
        array.push(value);
    }

    return array;
}

/**
 * If the value is in the array, removes it
 * @param array The array to modify in place
 * @param value The value to remove if present
 * @returns the array, modified in place
 */
export function removeIfPresent<T>(array: T[], value: T): T[] {
    const index = array.indexOf(value);

    if (index !== -1) {
        array.splice(index, 1);
    }

    return array;
}
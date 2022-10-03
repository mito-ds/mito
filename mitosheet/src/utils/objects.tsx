import { RecursivePartial } from "../types";

export function isDeepEqual(obj1: Record<string | number | symbol, any>, obj2: Record<string | number | symbol, any>): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    };

    for (var key of keys1) {
        const value1 = obj1[key];
        const value2 = obj2[key];

        const isObjects = value1 !== null && value2 !== null && typeof value1 === 'object' && typeof value2 === 'object';

        if (isObjects && !isDeepEqual(value1, value2)) {
            return false;
        } else if (!isObjects && value1 !== value2) {
            return false;
        }
    }

    return true;
}

/* 
    Returns a key that maps to a value in a given
    object. Defaults to the empty string if it
    cannot find anything.
*/
export function getKeyFromValue<T>(object: Record<string, T>, value: T): string {
    const key = Object.keys(object).find(key => object[key] === value)
    return key !== undefined ? key : '';
}

// Object.assign but works with nested objects
function recurseObjectAssign(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
    
    Object.getOwnPropertyNames(source).forEach((key) => {
        const sourceValue = source[key];
        const targetValue = target[key];

        // If source and target are both objects, we recurse
        if (typeof sourceValue === 'object' && typeof targetValue === 'object') {
            recurseObjectAssign(targetValue, sourceValue);
        } else {
            target[key] = sourceValue;
        }
    })

    
    return target;

}

/**
 * Given an object an a partial object, will update the object with the partial object.
 * Works with nested objects.
 */
export function updateObjectWithPartialObject<T>(graphParams: T, update: RecursivePartial<T>): T {
    const newParams: T = JSON.parse(JSON.stringify(graphParams));
    recurseObjectAssign(newParams, update);
    return newParams;
}
import { RecursivePartial } from "../types";

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
 * 
 * Note: There is a bug here where if a key in the object only has undefined values, it will be dropped 
 * while making a copy of the original object. Read more here: https://stackoverflow.com/questions/26540706/preserving-undefined-that-json-stringify-otherwise-removes
 */
export function updateObjectWithPartialObject<T>(obj: T, update: RecursivePartial<T>): T {
    const newParams: T = JSON.parse(JSON.stringify(obj));
    recurseObjectAssign(newParams, update);
    return newParams;
}

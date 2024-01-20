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
 */
export function updateObjectWithPartialObject<T>(obj: T, update: RecursivePartial<T>): T {
    const newParams: T = window.structuredClone(obj);
    recurseObjectAssign(newParams as any, update);
    return newParams;
}

export function shallowEqual(object1: Record<string, any>, object2: Record<string, any>): boolean {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (const key of keys1) {
        if (object1[key] !== object2[key]) {
            return false;
        }
    }
    return true;
}

export function shallowEqualToDepth(object1: Record<string, any>, object2: Record<string, any>, depth: number): boolean {
    const keys1 = Object.keys(object1);
    const keys2 = Object.keys(object2);
    if (keys1.length !== keys2.length) {
        return false;
    }
    for (const key of keys1) {
        if (typeof object1[key] === 'object' && typeof object2[key] == 'object') {
            if (depth > 0) {
                return shallowEqualToDepth(object1[key], object2[key], depth - 1);
            }
        }

        if (object1[key] !== object2[key]) {
            return false;
        }
    }
    return true;
}
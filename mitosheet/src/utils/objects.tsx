/* 
    Returns a key that maps to a value in a given
    object. Defaults to the empty string if it
    cannot find anything.
*/
export function getKeyFromValue<T>(object: Record<string, T>, value: T): string {
    const key = Object.keys(object).find(key => object[key] === value)
    return key !== undefined ? key : '';
}
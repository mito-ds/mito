/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

export const deepEqualArrays = (arr1: any[], arr2: any[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (typeof arr1[i] === 'object' && typeof arr2[i] === 'object') {
        if (!deepEqualArrays(arr1[i], arr2[i])) return false;
      } else if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
}
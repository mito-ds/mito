/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import { FilterGroupType, FilterType } from "../../../../../types";


// See: https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
export function isFilterGroup(filter: FilterType | FilterGroupType): filter is FilterGroupType {
    return (filter as FilterGroupType).filters !== undefined;
}


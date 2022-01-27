// Copyright (c) Mito

import { FilterGroupType, FilterType } from "../../../../../types";


// See: https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards
export function isFilterGroup(filter: FilterType | FilterGroupType): filter is FilterGroupType {
    return (filter as FilterGroupType).filters !== undefined;
}


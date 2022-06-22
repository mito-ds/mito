#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.


from typing import Any, List


def get_deduplicated_list(l: List[Any], preserve_order=True) -> List[Any]:

    if preserve_order:
        new_list = []
        for i in l:
            if i not in new_list:
                new_list.append(i)
        return new_list
    else:
        return list(set(l))


def get_list_difference(l1: List[Any], l2: List[Any]) -> List[Any]:
    second = set(l2)
    return [item for item in l1 if item not in second]
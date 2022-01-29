#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.

"""
Contains some types
"""

from typing import List, Union, Tuple

ColumnID = str

# A column header is either a primative type
PrimativeColumnHeader = Union[int, float, bool, str]
MultiLevelColumnHeader = Union[Tuple[PrimativeColumnHeader, ...], List[PrimativeColumnHeader]]
# To a tuple of primative types (TODO: does this nest further?).
ColumnHeader = Union[PrimativeColumnHeader, MultiLevelColumnHeader]



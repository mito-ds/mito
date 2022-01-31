#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.

"""
Contains some types that are useful in the Mitosheet package. 

We use type aliases to make many parts of the codebase more
explicit and clear, and make sure to test the types in our 
continous integration
"""

from typing import List, Union, Tuple

ColumnID = str

# A column header is either a primative type
PrimativeColumnHeader = Union[int, float, bool, str]
MultiLevelColumnHeader = Union[Tuple[PrimativeColumnHeader, ...], List[PrimativeColumnHeader]]
# To a tuple of primative types (TODO: does this nest further?).
ColumnHeader = Union[PrimativeColumnHeader, MultiLevelColumnHeader]



#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Makes sure we don't accidently deploy single threaded code
"""
from mitosheet.api.api import THREADED

def test_multi_threaded():
    assert THREADED
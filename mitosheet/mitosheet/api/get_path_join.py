#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import os
from typing import Any, Dict

def get_path_join(params: Dict[str, Any]) -> str:
    """
    Takes an event with path parts in a list, turns them into
    an actual path, normalizes it, and sends it back.

    Making path joining robust / cross platform compatible is actually really 
    tough, which is why we rely on Python to do it. We could use a JS package
    but instead of adding another dependency that might be incompatible, we just
    use the Python code on the backend.
    """ 
    path_parts = params['path_parts']

    # Join the path and normalize it
    path = os.path.join(*path_parts)
    path = os.path.normpath(path)

    if path == '.':
        path = os.getcwd()

    return path
    
    
    
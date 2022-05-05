#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
import os
from typing import Any, Dict, List


def get_path_parts(path: str) -> List[str]:
    """
    For a path, returns a list of the path broken down into
    pieces.

    TODO: test this on Windows
    """
    drive, path_and_file = os.path.splitdrive(path)
    path, file = os.path.split(path_and_file)

    folders = []
    # https://stackoverflow.com/questions/3167154/how-to-split-a-dos-path-into-its-components-in-python
    # We take the code from here, which apparently avoids entering an infinite loop
    # as it breaks when path != ''
    while 1:
        path, folder = os.path.split(path)

        if folder != "":
            folders.append(folder)
        elif path != "":
            folders.append(path)

            break

    folders.reverse()
    return [drive] + folders + [file]


def get_path_contents(params: Dict[str, Any]) -> str:
    """
    Takes an event with path parts in a list, turns them into
    an actual path, and then sends an API response with those 
    path parts
    """ 
    path_parts = params['path_parts']

    # Join the path and normalize it (note this should be OS independent)
    path = os.path.join(*path_parts)
    path = os.path.normpath(path)

    # We default the path to "." on the frontend, but we replace
    # this with the current directory full path so we can get all
    # the path parts correctly 
    if path == '.':
        path = os.getcwd()

    try:
        # This loop defines these variables, but does nothing with them
        # so we can then return them (which is why we break immediately)
        for (dirpath, dirnames, filenames) in os.walk(path):
            break
    
        # We sort the files so they are alphabetical (ignoring case)
        dirnames = sorted(dirnames, key=str.lower)
        filenames = sorted(filenames, key=str.lower)
    except:
        # If we cannot read the current path, this is a result of the fact
        # that there are permission errors (or something), in which case we
        # just return an empty result
        dirnames = []
        filenames = []
    
    # We then filter out any hidden folders, which we don't want users to be able
    # to see (as they would otherwise). 
    # Linux, Max == starts with "."
    # Windows == "$"
    dirnames = [d for d in dirnames if (not d.startswith('.') and not d.startswith('$'))]

    return json.dumps({
        'path': path,
        'path_parts': get_path_parts(path),
        # For each element, record if it's a directory, and the time it was last modified
        'elements': [
            {'name': f, 'isDirectory': False, 'lastModified': os.path.getmtime(os.path.join(path, f))} for f in filenames
        ] + [
            {'name': d, 'isDirectory': True, 'lastModified': os.path.getmtime(os.path.join(path, d))} for d in dirnames
        ]
    })
    
    
    
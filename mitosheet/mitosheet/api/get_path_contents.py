#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
import os
from typing import Any, Dict, List, Optional
import platform
import string

# The WINDOWS_DRIVE_PATH is needed so that we can mock a root directory for Windows that 
# allows the user to select one of their drives to nagivate in. If we were only supporting Mac, 
# we would not need this becuase the root folder is just /
WINDOWS_DRIVE_PATH = 'windows_drive_path'

def get_path_modified(path: str, f: str) -> Optional[str]:
    """
    For a path, returns when it was last modified. If that path is unaccessible, 
    for example if the path is a disconnected Google Drive that can no longer be read,
    it returns None
    """
    try:
        return os.path.getmtime(os.path.join(path, f))
    except:
        return None

def get_windows_drives() -> List[str]:
    """
    Returns a list of all the drives on a Windows machine. 
    See https://stackoverflow.com/questions/827371/is-there-a-way-to-list-all-the-available-windows-drives 
    for more information.
    """
    drives = []

    # Ctypes only exports windll on windows computers. 
    # Read more here: https://docs.python.org/3/library/ctypes.html#module-ctypes
    if platform.system() == 'Windows':
        from ctypes import windll
        bitmask = windll.kernel32.GetLogicalDrives()
        for letter in string.ascii_uppercase:
            if bitmask & 1:
                # Add :/ to the end to complete the drive. Not having :/ on the end causes os to fail when reading the drive
                drives.append(letter + ':/') 
            bitmask >>= 1

    return drives

def is_path_windows_drive(path: str) -> bool:
    """
    Returns true if the path is 3 characters ending with :/
    """
    return len(path) == 3 and path[1] == ':' and path[2] == '/'

def is_path_windows_drive_missing_slash(path: str) -> bool:
    """
    Returns true if the path is 2 characters ending with :
    """
    return len(path) == 2 and path[1] == ':'

def get_path_parts(path: str) -> List[str]:
    """
    For a path, returns a list of the path broken down into
    pieces.
    """
    # If the full path is WINDOWS_DRIVE_PATH, then we shouldn't try to 
    # split it into path parts. Instead, we just return our default path .
    if path == WINDOWS_DRIVE_PATH:
        return ['.']
    
    # On Windows, drive will be C: or D:, etc. On Unix, drive will be empty.
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
    if drive != '':
        # If the drive is not empty, then include it. This occurs when we're on Windows!
        return [drive] + folders + [file]
    else:
        # If the drive is '' then we are on a Linux system and the root folder / is contained in the folders.
        # We get rid of the empty path so that we can easily handle windows and linux paths the same.
        return folders + [file]


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

    if is_path_windows_drive_missing_slash(path):
        # If the windows drive does not have a trailing slash, eg C:,
        # then its not a valid path and os.walk will not work properly
        path = path + '/'

    if path == WINDOWS_DRIVE_PATH and platform.system() == 'Windows':
        # If the path only has one part, it means they are accessing the root folder. If the user is on
        # Windows, this folder doesn't exist so we fake one by letting them pick amongst their drives.
        filenames = []
        dirnames = get_windows_drives()
    else:
        # We default the path to "." on the frontend, but we replace
        # this with the current directory full path so we can get all
        # the path parts correctly 
        if path == '.':
            path = os.getcwd()

        try:
            # This loop defines these variables, but does nothing with them
            # so we can then return them (which is why we break immediately).
            # If the path is just a windows drive that is formatted like C or C:, instead of C:/,
            # then os.walk does not work properly. 
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
    
    # We then filter out any hidden folders and files, which we don't want users to be able
    # to see (as they would otherwise). 
    # Linux, Max == starts with "."
    # Windows == "$"
    dirnames = [d for d in dirnames if (not d.startswith('.') and not d.startswith('$'))]
    filenames = [f for f in filenames if (not f.startswith('.') and not f.startswith('$'))]

    return json.dumps({
        'path': path,
        'path_parts': get_path_parts(path),
        # For each element, record if it's a directory, and the time it was last modified
        'elements': [
            {'name': f, 'isDirectory': False, 'lastModified': get_path_modified(path, f)} for f in filenames
        ] + [
            {'name': d, 'isDirectory': True, 'lastModified': get_path_modified(path, d)} for d in dirnames
        ]
    })
    
    
    
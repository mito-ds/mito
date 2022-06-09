#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
import json
import os
from typing import Any, Dict, List, Optional
import platform
import string

# The Mito drive placeholder is needed so that we can mock a root directory for Windows that 
# allows the user to select one of their drives to nagivate in. If we were only supporting Mac, 
# we would not need this becuase the root folder is just /

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
                # We need to add :/ to the end of the letter so that the 
                drives.append(letter + ':/') # Add :/ to the end to complete the drive . We can't do this because it makes the os handle the paths incorrectly
            bitmask >>= 1

    return drives

def is_path_windows_drive(path: str) -> bool:
    return len(path) == 3 and path[1] == ':' and path[2] == '/'

def is_path_windows_drive_missing_slash(path: str) -> bool:
    return len(path) == 2 and path[1] == ':'

def get_path_parts(path: str) -> List[str]:
    """
    For a path, returns a list of the path broken down into
    pieces.
    TODO: test this on Windows
    """
    # If the path is just length 1, then its just the drive, not the path
    if path == '.':
        print('1. path parts: [.]')
        return ['.']
    if is_path_windows_drive(path):
        print('2. path parts: ', path)
        return [path]
    
    # On Windows, drive will be C: or D:, etc. On Unix, drive will be empty.
    drive, path_and_file = os.path.splitdrive(path)
    print('drive: ', drive, ' path and file: ', path_and_file)
    path, file = os.path.split(path_and_file)
    print('path traversing: ', path)

    folders = []
    # https://stackoverflow.com/questions/3167154/how-to-split-a-dos-path-into-its-components-in-python
    # We take the code from here, which apparently avoids entering an infinite loop
    # as it breaks when path != ''
    # If the path is empty, which means that we're trying to load the windows drives, then don't do anything
    if path != '':
        while 1:
            path, folder = os.path.split(path)

            if folder != "":
                folders.append(folder)
            elif path != "":
                folders.append(path)

                break

    folders.reverse()
    if drive != '':
        print('3. path parts: ', [drive] + folders + [file])
        return [drive] + folders + [file]
    else:
        # If the drive is '' then we are on a Linux system and the root folder / is contained in the folders.
        # We get rid of the empty path so that we can easily handle windows and linux paths the same.
        print('4. path parts: ',  folders + [file])
        return folders + [file]


def get_path_contents(params: Dict[str, Any]) -> str:
    """
    Takes an event with path parts in a list, turns them into
    an actual path, and then sends an API response with those 
    path parts
    """ 
    path_parts = params['path_parts']
    print('received path parts: ', path_parts)
    path_length = len(path_parts)

    # Join the path and normalize it (note this should be OS independent)
    path = os.path.join(*path_parts)
    path = os.path.normpath(path)

    print('received path: ', path)
    if is_path_windows_drive_missing_slash(path):
        path = path + '/'

    if path == '.' and platform.system() == 'Windows':
        # If the path only has one part, it means they are accessing the root folder. If the user is on
        # Windows, this folder doesn't exist so we fake one by letting them pick amongst their drives.
        filenames = []
        dirnames = get_windows_drives()
        print("in here")
    else:
        # We default the path to "." on the frontend, but we replace
        # this with the current directory full path so we can get all
        # the path parts correctly 
        if path == '.':
            print('found the path of .')
            path = os.getcwd()

        try:
            # This loop defines these variables, but does nothing with them
            # so we can then return them (which is why we break immediately).
            # If the path is just a windows drive, like C, and there is no : on the end, 
            # os.walk does not return anything.
            # If the path is just C:, then it returns the mitosheet directory instead of the contents
            # of the C drive. 
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

    print(dirnames, filenames)

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
    
    
    
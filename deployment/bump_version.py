#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.


# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains utilities for bumping the version of a Mito project, across
all the files where it needs to be bumped. 
"""

import json
from sys import argv
from typing import Optional, Tuple, Union
import urllib.request


def get_pypi_version(package_name: str, on_dev: Optional[bool]=None) -> str:
    """
    Utilities for getting the most recently deployed
    version of a Python package on a specific PyPi index.

    We use these to set the version of the Mito package
    before we deploy it. We do not store this information
    locally so that we don't need to commit it back to the
    repo. 

    Commiting it caused all sorts of issues, mostly
    with the versions getting out of date, and causing
    merge conflicts, etc.
    """

    if on_dev:
        url = f"https://test.pypi.org/pypi/{package_name}/json"
    else:
        url = f"https://pypi.org/pypi/{package_name}/json"

    try:
        response = urllib.request.urlopen(url).read().decode()
        data = json.loads(response)
        return data['info']['version']
    except urllib.error.HTTPError:
        # If we don't have a last version deployed, default to 0.1.0
        return '0.1.0'

def version_string_to_tuple(version_string: str) -> Tuple[int, int, int]:
    return tuple(map(int, version_string.split('.'))) # type: ignore

def get_next_version(package: str, on_dev: bool) -> Tuple[int, int, int]:
    last_pypi_version = get_pypi_version(package, on_dev=on_dev)
    print("Current pypi version", last_pypi_version)
    (x, y, z) = version_string_to_tuple(last_pypi_version)
    new_version = (x, y, z + 1)
    print("New version", new_version)
    return new_version

def bump_version_mitoinstaller(on_dev: bool) -> None:
    with open('mitoinstaller/__init__.py', 'r+') as f:
        current_version_string = get_pypi_version('mitoinstaller', on_dev)
    (x, y, z) = version_string_to_tuple(current_version_string)
    new_version = (x, y, z + 1)
    with open('mitoinstaller/__init__.py', 'w+') as f:
        f.write(f'__version__ = \'{".".join(map(str, new_version))}\'')

def bump_version(package: str, deploy_location: str, new_version: Optional[Tuple[int, int, int]]=None) -> None:
    """
    Bumps the version of the Mito project to the next minor logical version. Must pass
    the package as `mitosheet`, `mitosheet2`, or `mitosheet3`, so we know which version to bump.

    Alternatively, can bump the version of `mitoinstaller` by passing `mitoinstaller`, 
    which does not pass through the package.json.

    If a new_version is given, then will bump to that version specificially. new_version
    should be a tuple of the form (x, y, z).

    Note that this should be run in the folder of the package that is getting its version
    bumped (e.g. the folder where the setup.py is).
    """
    on_dev = deploy_location == 'dev'

    if package == 'mitoinstaller':
        bump_version_mitoinstaller(on_dev)
        return

    if new_version is None:
        new_version = get_next_version(package, on_dev)

    print("new version", new_version)

    # We just need to change the version in the package.json
    with open('package.json', 'r+') as f:
        package_obj = json.loads(f.read())
        # Sanity check that we are bumping the version of the package
    
    assert package_obj['name'] == package
    package_obj['version'] = '.'.join(map(str, new_version))

    with open('package.json', 'w') as f:
        f.write(json.dumps(package_obj, indent=2))

    print(f'Bump {package} version to {new_version}')

if __name__ == '__main__':
    import sys
    new_version = version_string_to_tuple(sys.argv[3]) if len(sys.argv) >= 4 else None
    bump_version(sys.argv[1], sys.argv[2], new_version)
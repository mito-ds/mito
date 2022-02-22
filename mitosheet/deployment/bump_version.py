#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Mito.
# Distributed under the terms of the Modified BSD License.

"""
Contains utilities for bumping the version of a Mito project, across
all the files where it needs to be bumped. 
"""

import json
from typing import Tuple, Union
import urllib.request


def get_pypi_version(package_name: str, on_dev: bool=None) -> Union[None, str]:
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
        url = f'https://test.pypi.org/project/{package_name}/'
    else:
        url = f'https://pypi.org/project/{package_name}/'

    try:
        contents = urllib.request.urlopen(url).read().decode().split('\n')
        tag = f'<a class="card release__card" href="/project/{package_name}/'
        contents_with_package_link = [c for c in contents if tag in c]
        last_version = contents_with_package_link[0].strip().split(tag)[1][:-3]
        return last_version
    except urllib.error.HTTPError:
        # If we don't have a last version deployed, default to 0.1.0
        return '0.1.0'

def version_string_to_tuple(version_string: str) -> Tuple[int, int, int]:
    return tuple(map(int, version_string.split('.')))

def get_next_version(package: str, on_dev: bool) -> Tuple[int, int, int]:
    last_pypi_version = get_pypi_version(package, on_dev=on_dev)
    (x, y, z) = version_string_to_tuple(last_pypi_version)
    return (x, y, z + 1)

def bump_version_mitoinstaller(on_dev: bool):
    with open('installer/mitoinstaller/__init__.py', 'r+') as f:
        current_version_string = get_pypi_version('mitoinstaller', on_dev)
    (x, y, z) = version_string_to_tuple(current_version_string)
    new_version = (x, y, z + 1)
    with open('installer/mitoinstaller/__init__.py', 'w+') as f:
        f.write(f'__version__ = \'{".".join(map(str, new_version))}\'')

def bump_version(package, deploy_location: str, new_version: Tuple[int, int, int]=None):
    """
    Bumps the version of the Mito project to the next minor logical version. Must pass
    the package as `mitosheet`, `mitosheet2`, or `mitosheet3`, so we know which version to bump.

    Alternatively, can bump the version of `mitoinstaller` by passing `mitoinstaller`, 
    which does not pass through the package.json.

    If a new_version is given, then will bump to that version specificially. new_version
    should be a tuple of the form (x, y, z).
    """
    on_dev = deploy_location == 'dev'

    if package == 'mitoinstaller':
        bump_version_mitoinstaller(on_dev)
        return

    if new_version is None:
        new_version = get_next_version(package, on_dev)

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
    bump_version(sys.argv[1], sys.argv[2])
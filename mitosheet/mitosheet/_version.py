#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
import os
import tarfile
from pathlib import Path
from typing import Any, Dict


def get_package_json() -> Dict[str, Any]:
    """
    This helper function is responsible for getting the package.json that is bundled
    with the javascript code bundle inside this Python package. 

    When the package is mitosheet (aka, jlab 2), then the mitosheet/labextension folder
    contains a .tgz zip file that contains the package.json. 

    When the package is mitosheet3 (aka, jlab3), then the mitosheet/labextension folder
    contains the package.json directly (as this is the new build process!).

    Thus, this function handles each case, to make sure we can get the current version 
    of the mitosheet package correctly.
    """
    lab_extension_folder = os.path.join(Path(__file__).parent, 'labextension')

    try:
        # First, try and get the jlab 3 case
        package_json_path = os.path.join(lab_extension_folder, 'package.json')
        return json.loads(open(package_json_path).read())
    except:
        # If we cannot get the package json directly, then it must be zipped (as it is
        # in jlab 2), and so we pull out the package json
        tar_file_name = list(filter(lambda x: x.endswith('tgz'), os.listdir(lab_extension_folder)))[0]
        tar_file_path = os.path.join(lab_extension_folder, tar_file_name)
        with tarfile.open(tar_file_path, 'r:gz') as t:
            package_json_file = t.extractfile('package/package.json')
            if package_json_file is None:
                raise Exception("Error: no package.json found in mitosheet/. Did you build the extension correctly.")
            package_json_str = package_json_file.read()
            return json.loads(package_json_str)

package_json = get_package_json()

__version__ = package_json['version']

package_name = package_json['name']

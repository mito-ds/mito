#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
import json
import os
from pathlib import Path

"""
This code is responsible for getting the package.json that is bundled
with the javascript code bundle inside this Python package, so we can 
get the version of the package. This means we can easily bump the package
version in one place (package.json) and have it automatically update here too. 
This is nice for the release process. 

Since this is a Jupyter Lab 4 extension, the mito-ai/labextension folder
contains the package.json directly. So we can just read it there. 
"""
lab_extension_folder = os.path.join(Path(__file__).parent, 'labextension')

package_json_path = os.path.join(lab_extension_folder, 'package.json')
package_json = json.loads(open(package_json_path).read())

__version__ = package_json['version']
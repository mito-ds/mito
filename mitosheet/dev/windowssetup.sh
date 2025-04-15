#!/bin/bash -eu
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.


# Setup a new venv
rm -rf venv/
python3 -m venv venv
venv/Scripts/activate.bat

# Install Python dependencies
pip install -e ".[test, deploy]"

# Make sure the Node options are set properly, or later build commands fail
# with versions of Node > 16
unset NODE_OPTIONS # https://github.com/microsoft/vscode/issues/136599
export NODE_OPTIONS=--openssl-legacy-provider

# Install the npm dependences
jlpm install

# Setup JupyterLab development
jupyter labextension develop . --overwrite

# Finially, start watching the javascript
jlpm run watch
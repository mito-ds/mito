#!/bin/bash -eu

# Setup a new venv
rm -rf venv/
python3 -m venv venv
source venv/bin/activate

# Switch to the mitosheet package, which we develop on by default
python switch.py mitosheet

# Install Python dependencies
pip install -e ".[test, deploy]"

# Make sure the Node options are set properly, or later build commands fail
# with versions of Node > 16
unset NODE_OPTIONS # https://github.com/microsoft/vscode/issues/136599
export NODE_OPTIONS=--openssl-legacy-provider

# Install the npm dependences
npm install

# Setup JupyterLab development
jupyter labextension develop . --overwrite

# Setup Jupyter Notebook development
jupyter nbextension uninstall mitosheet # NOTE: not sure why this first is needed. Somehow, it gets installed in the setup.py...
jupyter nbextension install --py --symlink --sys-prefix mitosheet
jupyter nbextension enable --py --sys-prefix mitosheet   

# Finially, start watching the javascript
jlpm run watch
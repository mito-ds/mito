#!/bin/bash -eu

# Setup a new venv
rm -rf venv/
python3 -m venv venv
source venv/bin/activate

# Switch to the mitosheet package
python switch.py mitosheet

# Install Python dependencies
pip install -e ".[test, deploy]"

# Make sure the node options are set properly, or this fails
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
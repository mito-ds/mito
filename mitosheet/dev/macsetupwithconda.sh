#!/bin/bash -eu

# NOTE: in this, we assume we're passed a conda name $1

conda init bash
conda activate $1

# Make sure the Node options are set properly, or later build commands fail
# with versions of Node > 16
export NODE_OPTIONS=--openssl-legacy-provider

# Switch to the mitosheet package, which we develop on by default
python switch.py mitosheet

# Install Python dependencies
pip install -e ".[test, deploy]"

# Install the npm dependences
npm install

# Setup JupyterLab development
jupyter labextension develop . --overwrite
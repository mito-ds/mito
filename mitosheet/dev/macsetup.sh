#!/bin/bash -eu
set -e

echo "Setting up the mitosheet development env"
echo "This might take a few moments..."

# Make sure the Node options are set properly, or later build commands fail
# with versions of Node > 16
read -p "Set legacy open ssl provider on node? You probably want no. [y/n] " -n 1 -r
echo    # move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    export NODE_OPTIONS=--openssl-legacy-provider
fi

# Setup a new venv
rm -rf venv/
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -e ".[test, deploy]"

# Install the node modules, and build the JS 
yarn install
yarn run build

# Setup JupyterLab development
jupyter labextension develop . --overwrite

# Finially, start watching the javascript
yarn run watch
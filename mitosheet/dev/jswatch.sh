#!/bin/bash -eu

# Activate the enviornment
source venv/bin/activate

# Make sure the Node options are set properly, or later build commands fail
# with versions of Node > 16
unset NODE_OPTIONS # https://github.com/microsoft/vscode/issues/136599
export NODE_OPTIONS=--openssl-legacy-provider  

# Finially, start watching the javascript
jlpm run watch
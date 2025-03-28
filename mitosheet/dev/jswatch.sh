#!/bin/bash -eu
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.


# checktestpypi.sh: this script should be run in the monorepo/mitosheet folder
# and will just run the javascript watch command

# Activate the environment
source venv/bin/activate

# Make sure the Node options are set properly, or later build commands fail
# with versions of Node > 16
unset NODE_OPTIONS # https://github.com/microsoft/vscode/issues/136599
export NODE_OPTIONS=--openssl-legacy-provider  

# Finially, start watching the javascript
jlpm run watch
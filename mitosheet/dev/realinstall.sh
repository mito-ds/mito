#!/bin/bash -eu

# realinstall.sh: this is a script that you can run from anywhere on your 
# computer, and it will create a new folder, a clean virtual enviornment,
# and install the `mitosheet` package on it. 

# Create a folder name
FOLDER_NAME=$(date +"%Y-%m-%d-%s")

# Make this folder
echo "Making ${FOLDER_NAME}"
mkdir "${FOLDER_NAME}"

# Ask the user if they want to clear the user.json
read -p "Reset user.json? [y/n] " -n 1 -r
echo    # move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    rm -rf ~/.mito/user.json
fi

cd "${FOLDER_NAME}"

python3 -m venv venv
source venv/bin/activate

pip install mitoinstaller
python -m mitoinstaller install --no-cache-dir



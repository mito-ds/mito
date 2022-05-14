#!/bin/bash -eu

# checktestpypi.sh: this is a script that you can run from anywhere on your 
# computer, and it will create a new folder, a clean virtual enviornment,
# and install the `mitosheet` package from test pypi. 

# Create a folder name
FOLDER_NAME=$(date +"%Y-%m-%d-%s")

# Make this folder
echo "Making ${FOLDER_NAME}"
mkdir "${FOLDER_NAME}"

# Ask the user if they want to clear the user.json
read -p "Reset user.json? " -n 1 -r
echo    # move to a new line
if [[ $REPLY =~ ^[Yy]$ ]]
then
    rm -rf ~/.mito/user.json
fi

# Make sure that on exit we can delete the folder so we don't make a bunch of trash 
trap ctrl_c INT
function ctrl_c() {
    read -p "Do you want to delete the folder ${FOLDER_NAME}? " -n 1 -r
    echo    # move to a new line
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        rm -rf "${FOLDER_NAME}"
    fi
    exit 0
}

cd "${FOLDER_NAME}"

python3 -m venv venv
source venv/bin/activate

pip install mitoinstaller
python -m mitoinstaller install --test-pypi



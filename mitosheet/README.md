# The Mito Spreadsheet

This folder contains the `mitosheet` python package, as well as some other utilities for deploying Mito. 

Note that you can develop in with JLab 2 or JLab 3, as we currently support both!


## Mitosheet with JLab 2

First, delete any existing virtual enviornment that you have in this folder, and create a new virtual enviornment.

On Mac:
```
rm -rf venv;
python3 -m venv venv;
source venv/bin/activate;
```

On Windows:
```
rmdir /s venv
python3 -m venv venv
venv\Scripts\activate.bat
```

Then, make sure that you have switched to `mitosheet` as the correct package (as this is the name of the package that we use with JLab 2). You can perform this with the command:
```
python switch.py mitosheet
```

Then, run the following commands to create a virtual enviorment, install a development version of `mitosheet` in it, and then launch Jupyter Lab 2.0.
```bash
pip install -e ".[test, deploy]"
jupyter labextension install @jupyter-widgets/jupyterlab-manager@2 --no-build
jupyter labextension install .
yarn cache clean
jupyter lab --watch
```

In a seperate terminal, to recompile the front-end, run the command:
```
npm run watch:lib
```

### One Liner Command for Mac
```bash
deactivate; rm -rf venv; python3 -m venv venv && source venv/bin/activate && python switch.py mitosheet && pip install -e ".[test, deploy]" && jupyter labextension install @jupyter-widgets/jupyterlab-manager@2 --no-build && jupyter labextension install . && yarn cache clean && jupyter lab --watch
```

## Mitosheet with JLab 3
First, delete any existing virtual enviornment that you have in this folder, and create a new virtual enviornment. 

On Mac:
```
rm -rf venv;
python3 -m venv venv;
source venv/bin/activate;
```

On Windows:
```
rmdir /s venv
python3 -m venv venv
venv\Scripts\activate.bat
```

Then, make sure that you have switched to `mitosheet3` as the correct package (as this is the name of the package that we use with JLab 3). You can perform this with the command:
```
python switch.py mitosheet3
```

Then, run the following commands to create a virtual enviorment, install a development version of `mitosheet` in it, and then launch Jupyter Lab 3.0.
```bash
pip install -e ".[test, deploy]"
jupyter labextension develop . --overwrite
jupyter lab
```

In a seperate terminal, to recompile the front-end, run the following commands (`npm install` only needs to be run the first time).
```
npm install
jlpm run watch
```

NOTE: On Windows, this seperate terminal _must_ be a Adminstrator terminal. To launch an admin terminal, search for Command Prompt, and then right click on the app and click Run as adminstrator. Then navigate to the virtual enviornment, start it, and then run `jlpm run watch`. 

Furthermore, if the final `jlpm run watch` command fails, you need may need to run `export NODE_OPTIONS=--openssl-legacy-provider`. 

If the folder `pip-wheel-metadata` exists in your Mito folder, delete it. 

### One Liner Command for Mac
```bash
deactivate; rm -rf venv; python3 -m venv venv && source venv/bin/activate && python switch.py mitosheet3 && pip install -e ".[test, deploy]" && jupyter labextension develop . --overwrite && jupyter lab
```

# Testing

## Backend Tests

Run automated backend tests with
```
pytest
```
Automated tests can be found in  `mitosheet/tests`. These are tests written using standard `pytest` tools, and include tests like testing the evaluate function, the MitoWidget, and all other pure Python code. 


### Linting

This project has linting set up for both (Python)[https://flake8.pycqa.org/en/latest/index.html] and (typescript)[https://github.com/typescript-eslint/typescript-eslint]. 

Run typescript linting with the command 
```
npx eslint . --ext .tsx --fix
```

### Using the fuzzer

Setting up the fuzzer is an annoying and long process, and so we do not include it in the main install commands for setting up Mito (for now, we will if we figure out how to optimize this). 

To use the fuzzer, you need to install `pip install atheris`. This might work for you (it didn't for me). If it doesn't work, and you get a red error, check the error to see if it is telling you to download the latest version of clang. If it is, then try:

```
cd ~
git clone https://github.com/llvm/llvm-project.git
cd llvm-project
mkdir build
cd build
cmake -DLLVM_ENABLE_PROJECTS='clang;compiler-rt' -G "Unix Makefiles" ../llvm # NOTE: if this doesn't work, you might need to install cmake. Google how to do this
make -j 100 # This literally takes hours
```
Then, go back to the venv you want to install the fuzzer in, and run: `CLANG_BIN="/Users/nate/llvm-project/build/bin/clang" pip install atheris`, and it should work. 

### Running the fuzzer

Run the fuzzer with 
`python mitosheet/tests/fuzz.py`, and it will run till it hits an error.


## How the Build Works

### For JLab 2

1. First, the TypeScript is compiled to JS, and placed in the `./lib` folder
2. Then, the `./lib` and `./css` folder (specified in files) are "packed" into the `./mitosheet` folder in `./mitosheet/labextension`.
3. The `mitosheet` package (including this JS and CSS) is then placed in the jupyter/share folder, whereever Jupyter is installed.
4. Then, JupyterLab is rebuilt, and the rebuild includes this new `mitosheet` package, including the JS + CSS it contains.

### For JLab 3

I am not totally sure.
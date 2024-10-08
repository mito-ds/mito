# The Mito Spreadsheet

The Mito spreadsheet is desgined to help folks automate their repeititive reporting with Python. Every edit you make to the Mito spreadsheet is automatically converted to production-ready Python code. Use spreadsheet formulas like VLOOKUP, pivot tables, and all of your favorite Excel functionality.

## Installing the Mito Spreadsheet

It is important to install the correct version of mitosheet for your version of JupyterLab. 

**JupyterLab 4.x**: To intall mitosheet for JupyterLab 4.x, run the following command:

```bash
pip install mitosheet
```

**JupyterLab 3.x**: To install mitosheet for JupyterLab 3.x, use the latest release of the mitosheet 0.1.x series. Run the following command:

```bash
pip install mitosheet~=0.1
```

## Codebase structure

This folder contains a variety of packages and utilities for the `mitosheet` Python package. The primary folders of interest:
- `mitosheet` contains the Python code for the `mitosheet` Python package. 
- `src` contains the TypeScript, React code for the `mitosheet` JupyterLab extension front-end.
- `css` contains styling for the frontend.
- `deployment` contains scripts helpful for deploying the `mitosheet` package

## The `mitosheet` Package

The mitosheet package currently works for JupyterLab 4.0, Streamlit, and Dash. 

### For Mac

We have a setup script for Mac. Just run
```
bash dev/macsetup.sh
```

#### Open JupyterLab

In a seperate terminal, run
```
source venv/bin/activate
jupyter lab
```
(note that the second command can be `jupyter notebook` if you want to develop in notebook).

#### Open Streamlit

In a seperate terminal, run
```
source venv/bin/activate
streamlit run /path/to/app.py
```

### For Windows

First, delete any existing virtual environment that you have in this folder, and create a new virtual environment. 

On Windows (in command prompt, not powershell):
```
rmdir /s venv
python3 -m venv venv
venv\Scripts\activate.bat
```

Then, run the following commands to create a virtual enviorment, install a development version of `mitosheet` in it, and then launch Jupyter Lab 3.0.
```bash
pip install -e ".[test, deploy]"
jupyter labextension develop . --overwrite
jupyter lab
```
If the `pip install -e ".test, deploy]"` fails and the folder `pip-wheel-metadata` exists in your Mito folder, delete it. 

In a seperate terminal, to recompile the front-end, run the following commands (`jlpm install` only needs to be run the first time).
```
jlpm install
jlpm run watch
```

NOTE: On Windows, this seperate terminal _must_ be a Adminstrator terminal. To launch an admin terminal, search for Command Prompt, and then right click on the app and click Run as adminstrator. Then navigate to the virtual environment, start it, and then run `jlpm run watch`. 

Furthermore, if the final `jlpm run watch` or `jlpm install` command fails, you may need to run `export NODE_OPTIONS=--openssl-legacy-provider`. 

### One Liner Command for Mac
```bash
deactivate; rm -rf venv; python3 -m venv venv && source venv/bin/activate && pip install -e ".[test, deploy]" && jupyter labextension develop . --overwrite && jupyter lab
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

This represents my best understanding of how the packaging process works. There might be slight misunderstandings here, so don't take this as gospel, but rather as the general shape of things.

### For JupyterLab 4 and Notebook 7

1. First, the TypeScript is compiled to JS, and placed in the `./lib` folder.
2. Then, the `./lib` and `./css` folder (specified in files) are build by the command `jupyter labextension watch .` into the `mitosheet/labextension` folder.
3. Note that `jupyter labextension watch .` figures out the source and destination locations through the `jupyterlab` information in the `package.json`. 

# Mito Installer README

The Mito installer is a separate Python package responsible for installing the `mitosheet` package from PyPi. 

On Mac:
```
python3 -m venv venv;
source venv/bin/activate;
pip install -r requirements.txt;
python -m mitoinstaller install
```

On Windows in command prompt:
```
python3 -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
python -m mitoinstaller install
```

## Running Tests

```
pytest
```

## Deploying the Installer 

1. Bump the version number in __init__.py

2. In the installer folder, run the command: `python setup.py sdist upload`
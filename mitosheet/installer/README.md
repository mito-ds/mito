# Mito Installer README

The Mito installer is a separate Python package responsible for installing the `mitosheet3` and `mitosheet` PyPI packages. It first attempts `mitosheet3`, and then falls back to `mitosheet`. 

```
python3 -m venv venv;
source venv/bin/activate;
pip install -r requirements.txt;
python -m mitoinstaller install
```

## Running Tests

```
pytest
```

## Deploying the Installer 

1. Bump the version number in __init__.py

2. In the installer folder, run the command: `python setup.py sdist upload`
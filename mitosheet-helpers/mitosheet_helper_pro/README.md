# Mitosheet Helper Pro

This is a helper package for mitosheet that requires a `Mito Pro` or `Mito Enterprise` license.

## Instructions

```
python3 -m venv venv;
source venv/bin/activate
pip install build twine
python3 -m build
python3 -m twine upload --repository testpypi dist/*
```
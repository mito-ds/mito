# Mitosheet Helper 4C2A

This is a helper package for mitosheet that requires a `pro` license.

## Instructions

```
python3 -m venv venv;
source venv/bin/activate
pip install build twine
python3 -m build
python3 -m twine upload --repository testpypi dist/*
```
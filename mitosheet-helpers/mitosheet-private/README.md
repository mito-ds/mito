# Mitosheet Private

The goal here is to replace the mitosheet-private package with a thin wrapper around mitosheet and mitosheet-helper-pro (which we likely need to change the license on). But we're gonna forget about this for now!

This is a helper package for mitosheet that requires a `Mito Pro` or `Mito Enterprise` license.

## Instructions

```
python3 -m venv venv;
source venv/bin/activate
pip install build twine
python3 -m build

```

DO NOT RUN: python3 -m twine upload --repository testpypi dist/*
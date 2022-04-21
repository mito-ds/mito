---
description: >-
  If you're looking to skip the installer, and install the `mitosheet` package
  in a Jupyter Notebook correctly, follow these instructions.
---

# Installing Mito in a Jupyter Notebook Directly

## Before Installing Mito

1. Check that you have **Python 3.6** **or above** by opening a terminal and running `python --version`

## Installation Instructions

First **open a new terminal or command prompt**. Then, download the Mitosheet package (this command may take a few moments to run).

```
python -m pip install mitosheet
```

Then, activate the extension:

```
python -m jupyter nbextension install --py --user mitosheet
python -m jupyter nbextension enable --py --user mitosheet
```

If you have a currently running Jupyter Notebook, restart your kernel and refresh the page. Then continue to creating a mitosheet.

{% content-ref url="../../how-to/creating-a-mitosheet/" %}
[creating-a-mitosheet](../../how-to/creating-a-mitosheet/)
{% endcontent-ref %}

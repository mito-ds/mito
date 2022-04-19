---
description: >-
  Installing Mito Inside a Virtual Environment can help fix installation
  problems.
---

# Installing Mito Inside a Virtual Environment

{% tabs %}
{% tab title="Python Virtual Environment" %}
First, create a new environment:

```
python3 -m venv mitoenv
```

Then, activate the environment. On Windows in command prompt:

```
mitoenv\Scripts\activate.bat
```

On Mac:

```
source mitoenv/bin/activate
```

Then, install the Mito installer:

```
python -m pip install mitoinstaller
```

Then, run it:

```
python -m mitoinstaller install
```
{% endtab %}

{% tab title="Conda Virtual Environment" %}
## Installing Mito in a Conda virtual environment <a href="#installing-mito-in-a-conda-virtual-environment" id="installing-mito-in-a-conda-virtual-environment"></a>

First, create a new conda environment:

```
conda create -n mitoenv python=3.8
```

Then, activate your new environment:

```
conda activate mitoenv
```

Then, download the Mito package:

```
python -m pip install mitoinstaller
```

Then, run the installer. This command may take a few moments to run:

```
python -m mitoinstaller install
```
{% endtab %}
{% endtabs %}

After installing, you can create your first Mitosheet:

{% content-ref url="../../how-to/creating-a-mitosheet/" %}
[creating-a-mitosheet](../../how-to/creating-a-mitosheet/)
{% endcontent-ref %}

---
description: This documentation will teach you how to create your first Mitosheet.
---

# Creating a Mitosheet

{% embed url="https://youtu.be/URM6kGfOJuM" %}

{% hint style="warning" %}
Before rendering a Mitosheet, make sure [you've installed Mito correctly. ](../../getting-started/installing-mito/)If you just installed mito, **make sure to refresh your Jupyter notebook.**
{% endhint %}

To create a new mitsoheet, open a new or existing Jupyter notebook. For classic Notebook users, you can launch Jupyter with `python -m jupyter notebook`. For JupyterLab users, you can launch Jupyter with `python -m jupyter lab`.

Once you've created a new notebook, copy and paste the code below into a Jupyter code cell.

```python
import mitosheet
mitosheet.sheet()
```

Then run the Mitosheet generating code by clicking on the code cell that contains it and pressing **Shift + Enter**.

{% hint style="warning" %}
If a Mitosheet does not appear, make sure that you followed the [Installation Instructions](../../getting-started/installing-mito/). If you ran the installer already, make sure to **refresh your JupyterLab server.**
{% endhint %}

Now that you've created your first Mitosheet, you're ready to[ import data into Mito.](../importing-data-to-mito.md)

{% hint style="info" %}
Our docs (and code) are open source! If you want to suggest changes to the documentation, add some sections, or check out or code, [follow us on Github](https://github.com/mito-ds/monorepo)
{% endhint %}

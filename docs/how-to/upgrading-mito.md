---
description: >-
  The Mito team moves quick. Run these commands to get the latest and greatest
  in time-saving spreadsheet functionality.
---

# Upgrading Mito

{% hint style="info" %}
If you don't have Mito installed yet, you can find installation instructions [here.](../getting-started/installing-mito/)
{% endhint %}

{% hint style="warning" %}
Want help? [Join our discord for immediate support.](https://discord.com/invite/XdJSZyejJU)
{% endhint %}

Upgrade Mito by opening the terminal and virtual environment that you installed Mito on. Make sure you have the most up to date version of the mitoinstaller, by running the command:

```
python -m pip install mitoinstaller --upgrade
```

Then, actually run the upgrade process:

```
python -m mitoinstaller upgrade
```

After running the above commands, restart your JupyterLab kernel, and refresh your browser page to load the new version of Mito.&#x20;

To see what is new in the Mitosheet since you last looked, check out the [release notes.](../misc./release-notes.md)

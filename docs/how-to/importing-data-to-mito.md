---
description: >-
  This documentation will show you how to import your data to Mito so you can
  start saving yourself time.
---

# Importing Data into Mito

{% embed url="https://youtu.be/BJf7g7Uhqu8" %}

Mito can handle any tabular data. If it's in a dataframe, then it's ready for Mito! There are two ways to get data into Mito, passing a dataframe to the Mitosheet and using the in-app import popup.

## Passing Dataframes to Mito

Mito displays any dataframe that is passed directly to a `mitosheet.sheet(df1, df2)`. To see an example of displaying a dataframe in a Mitosheet, copy and run the code below in a JupyterLab cell:

```python
# import Python packages
import mitosheet
import pandas as pd

# create some simple data to display
train_stations = pd.DataFrame({'Zip': [21001, 97321, 49224, 87102, 24910, 22301], 'City': ['Aberdeen', 'Albany', 'Albion', 'Albuquerque', 'Alderson', 'Alexandria'], 'State': ['MD', 'OR', 'MI', 'NM', 'WV', 'VA'], 'Ticket_Office': ['N', 'Y', 'N', 'Y', 'N', 'Y']})
demographics = pd.DataFrame({'Zip': [21001, 97321, 49224, 87102, 24910, 22301], 'Median_Income': [53979.0, 112924.0, 37556.0, 28388.0, 30914.0, 54087.0], 'Mean_Income': [66169.0, 147076.0, 50371.0, 39529.0, 40028.0, 64068.0], 'Pop': [18974.0, 11162.0, 14900.0, 22204.0, 5383.0, 19504.0]})

# render the Mitosheet with the data
mitosheet.sheet(train_stations, demographics)
```

Using Pandas, you can create dataframes by [reading csv files](https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read\_csv.html), [Excel files](https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read\_excel.html), or even [querying an SQL database](https://pandas.pydata.org/pandas-docs/stable/reference/api/pandas.read\_sql\_query.html). If you have dataframes you want to interact with and manipulate, pass them into a Mitosheet!

{% hint style="warning" %}
If a Mitosheet does not appear, make sure that you followed the [Installation Instructions](../getting-started/installing-mito/). Not downloading the Jupyter Lab extension manager is a common mistake.
{% endhint %}

## Using the Import Task-pane

Mito also has a point and click method for importing Excel (XLSX) and CSV files.

1. Click on the **Import button** in the Mito toolbar.
2. Select the files you want to import.
3. Click the Import Button.

![](<../.gitbook/assets/final mito import 2.png>)

If you import an XLSX file, the import modal will then open a screen that will allow you to configure the import.

1. Select the sheets you want to import. Each sheet will create a new dataframe.
2. Let Mito know if the sheet already has column headers or if Mito should create them.
3. Tell Mito how many rows to skip. ie: if there are comments at the top of the file!

{% hint style="warning" %}
Importing XLSX files is only supported on Python version greater than 3.6, and Pandas version >= 1.0. Please join our discord and let us know if you have any issues with this!
{% endhint %}

{% hint style="info" %}
Want help? [Get in contact](https://discord.com/invite/XdJSZyejJU) with our support team.
{% endhint %}

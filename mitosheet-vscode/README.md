# Mitosheet for Visual Studio Code

The Mito spreadsheet is desgined to automate repeititive reporting with Python. Every edit you make to the Mito spreadsheet is automatically converted to production-ready Python code. Use spreadsheet formulas like VLOOKUP, pivot tables, and all of your favorite Excel functionality.

**Filtering**

![Filtering columns](https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/mitosheet/mitosheet-filter.gif)

**Pivot Tables**

![Pivot tables](https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/mitosheet/mitosheet-pivot.gif)


**Charting**

![Charts](https://rnca6p7lwtzvybss.public.blob.vercel-storage.com/mitosheet/mitosheet-charts.gif)


## Install

In addition to installing this extension, you will also need the `mitosheet` Python package:

```bash
pip install mitosheet
```

## Getting Started

To create your first Mitosheet, open a new Jupyter Notebook and run:

```python
import mitosheet
import pandas as pd

df = pd.DataFrame({
    'A': [1, 2, 3],
    'B': [4, 5, 6]
})

mitosheet.sheet(df)
```
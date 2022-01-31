---
description: >-
  This page explains how you can use the code that Mito generates to carry
  forward your transformations to the rest of your analysis and automate tasks.
---

# Using the Generated Code

Each time you transform your data in the Mito spreadsheet, Mito generates the equivalent pandas code in the Jupyter Cell directly below the Mito spreadsheet. The code is production-ready, commented, pandas code that you can use however you wish.&#x20;

## Use the altered dataframes in your analysis

Because Mito generates pandas code for each edit you make in the Mito spreadsheet, its easy to use the altered dataframes in the rest of your analysis. Mito doesn't lock you in to completing your entire analysis in Mito -- it encourages you to utilize the rest of the powerful Python data analytics ecosystem.&#x20;

To use the altered dataframes in the rest of your analysis, run the code that Mito generates by click ingon the cell containing the code and press the play button in the Jupyter toolbar (or use the keyboard shortcut `shift + Enter`)

Once you've ran the generated code, you can use the altered dataframes in your analysis as you normally would, just by using the dataframe names.&#x20;

If you see this error, its probably because you forgot to run the Mito generated code!

![Undefined Variable Error](<../.gitbook/assets/Screen Shot 2021-12-27 at 2.17.42 PM.png>)

## Automate an Analysis

Once you've created a Python script, its easy to reuse that script on a new data set, so long as the new data set has a similar structure to original data set you used to create the script.&#x20;

Having a similar structure means:

* The dataframe names are the same in the original data set and the new data
* Any column that your script uses has the same column header and dtype in the original and new data set.&#x20;

_Note: there are some other use case specific reasons that a script might not be reusable. For example, if you've hardcoded filters that aren't relevant to the new dataset._&#x20;

If your data sets meet those requirements, then you're good to go! All you need to do is change the dataframe import statements, and rerun the script.&#x20;

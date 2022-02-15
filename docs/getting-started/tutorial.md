---
description: A quick guide to creating your first analysis with Mito.
---

# Tutorial

**Speeding Up Your Workflow 10x with Mito**

Welcome to Mito! This guide will show you how get **your Python analyses done 10x faster**, all within a familiar spreadsheet interface.

{% embed url="https://www.youtube.com/watch?v=VobWi0af-Tc" %}

In this tutorial, we'll walk you through your first analysis using Mito! We'll look for a connection between the number of Airports that allow pets and average household income in each U.S. state.

During this analysis, we'll see how to write formulas, merge data sets, and create pivot tables - and Mito will generate the equivalent Python for every edit we make!

### 1. Getting Data into Mito

{% file src="../.gitbook/assets/Mito Tutorial Data.zip" %}
Mito Tutorial Data
{% endfile %}

1. Launch your JupyterLab and create a blank notebook.
2. Download the example data below.
3. Drag and drop the data into your Jupyter file system. You can see a short video of how to do so [here](https://www.youtube.com/watch?v=1bd2QHqQSH4).
4. Copy and paste the following two lines of code into the first cell of your Jupyter notebook

```python
import mitosheet
mitosheet.sheet()
```

1. Press **Shift + Enter** to run the code you just copied and pasted. &#x20;

![](<../.gitbook/assets/Screen Shot 2021-06-29 at 3.55.08 PM.png>)

Great! Now that you've created a Mitosheet, let's add our data.

1. Click the **Import button**
2. Select **Airport-Pets.csv** and **Zipcode-Data.csv**.

{% hint style="info" %}
You can also pass dataframes directly into Mito using the syntax: mitosheet.sheet(df1, df2)
{% endhint %}

### 2. Merging Sheets Together

![](<../.gitbook/assets/Screen Shot 2021-04-14 at 8.46.23 PM.png>)

To understand the relationship between these datasets, we need to combine them together.

To combine the datasets, we'll use Mito's **Merge** functionality. **Merge** looks for matches between the key column of the first sheet and a key column of the second sheet, and then combines those matches into a single row.

1. Click the **Merge button** in the Mito toolbar.
2. Make sure that the Merge Key for both sheets is **Zip.**
3. Click the **X** button in the top right hand corner of the Merge taskpane because we want to keep all of the columns in our merged datasets.&#x20;

Notice that a new sheet, **df3**, was created. Let's rename it to something more informative.

1. Click on the gray downward facing arrow in the **df3** sheet tab at the bottom of the Mito Sheet.
2. Click **rename** and name the sheet **Data**.

Have you noticed the code that Mito generated below the Mito Sheet? For each edit that we made in Mito, we've generated the equivalent code - writing Python has never been so easy!

### 3. Writing Your First Formula!

![](<../.gitbook/assets/Screen Shot 2021-04-19 at 7.47.57 PM.png>)

Now that we've organized our data, we can move forward just like we were in Excel.

We're going to use a _pivot table_ to compare states, but first let's convert the **Pets** column into a format we can work with.

1. Click on the **Data** sheet tab.
2. Click on the **Add Column** button and notice the new column that was generated to the right of the selected column.
3. Click on the column header of the newly created column to give it a better name.
4. In the taskpane that appears, name the column **Allowed\_Pets** and press **Enter** to submit.
5. Close the taskpane by clicking the **X** button.

Now that we've got our new column setup, let's write a formula.

1. Using your mouse, select the first cell in the **Allowed\_Pets** column and press **Enter** to start writing a formula.
2. Write the formula, **=IF(Pets == 'Y', 1, 0)** which sets the column to 1 if the Pets column has a **Y** in it, and 0 otherwise.
3. Press **Enter** again to set your formula!

{% hint style="danger" %}
If you received an Oops! Execution Error, make sure that you used == instead of =.
{% endhint %}

### 4. Creating a Pivot Table

![](<../.gitbook/assets/Screen Shot 2021-04-19 at 7.51.55 PM.png>)

Pivoting allows us to slice and dice our data however we want, creating powerful analyses in seconds.

1. Click on the **Data** sheet tab
2. Click on the **Pivot** button in the toolbar
3. In the **Rows** section, select the **State** column, telling Mito to create one row for each state.
4. In the **Values** section, select the **Allowed\_Pets** column.
5. Click on the **count** button and select the **sum** aggregation method.
6. In the Values section, click on the add button again and select the **Median\_Income** column.&#x20;
7. Switch the aggregation method from **count** to **mean**

### 5. Sorting your Results

![](<../.gitbook/assets/Screen Shot 2021-04-19 at 8.02.17 PM.png>)

Now that our data is grouped, let's sort it to look for a relationship between allowed pets and average state income.

1. Make sure you selected the Mito Sheet tab **df4**
2. Click on the **filter icon** in the **Median\_Income** column header to open the column control panel.&#x20;
3. Click the **Descending** button, and notice that the data is now sorted in descending order.
4. Click the **X** button to close the taskpane.

### 6. Interacting with the Generated Python Code

As we've noted a few times throughout this tutorial, each time we made an edit to Mito, the equivalent production-ready Python code is generated right below the Mito Sheet!

To interact with the generated code:

1. Select the Mito generated code cell. It's right below the Mito sheet, and should start with&#x20;

**# MITO CODE START (DO NOT EDIT).**

1. Press **Shift**+**Enter** to run the cell.

Now that we've ran the Mito generated code, we can use the updated dataframes throughout the rest of this notebook. Try it out by running the following code in a new code cell.

```python
df4.head()
```

We've used Mito to do our analysis, and **got the corresponding Python code for free**. Mito is the quickest way to get your Python data analytics done.

### 🎉 Congrats 🎉

You're ready to start writing Python code 10x faster! Now its time to [try it on your own data.](../how-to/importing-data-to-mito.md)

{% content-ref url="../how-to/importing-data-to-mito.md" %}
[importing-data-to-mito.md](../how-to/importing-data-to-mito.md)
{% endcontent-ref %}

{% hint style="info" %}
Our docs (and code) are open source! If you want to suggest changes to the documentation, add some sections, or check out or code, [follow us on Github](https://github.com/mito-ds/monorepo) 
{% endhint %}
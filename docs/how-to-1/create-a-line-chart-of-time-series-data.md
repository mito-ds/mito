# Create a line chart of time series data

#### Step 1: Check the dtype

Make sure that dtpye of your time series data is properly recognized as `datetime` by looking at the dtype indicator in the column header.&#x20;

If the dtype indicator does not say "date", see our [reference guide](../how-to/type-changes.md) for converting the dtype of a column and convert the column to a `datetime`.&#x20;

![Checking the dtype of a graph](<../.gitbook/assets/Screen Shot 2022-03-23 at 3.31.08 PM (1).png>)

#### Step 2: Create a new graph

To create a new graph, click on the `Graph` button in the Mito toolbar.&#x20;

![Creating a new graph](<../.gitbook/assets/Screen Shot 2022-03-23 at 3.32.15 PM (1).png>)

#### Step 3: Select the correct data

Set the sheet you want to graph as the graph's `Data Source`.

![Select the data source](<../.gitbook/assets/Screen Shot 2022-03-23 at 3.34.39 PM (1).png>)

#### Step 4: Select the line chart&#x20;

Set the chart type to `line`.

![Create a line chart](<../.gitbook/assets/Screen Shot 2022-03-23 at 3.40.57 PM.png>)

#### Step 5: Add data to your graph

Add data to the X and Y axis by clicking the `+ Add` button and selecting the column header of the data you want to add.&#x20;

In this example, I'm going to add my time series data, the column called Date, to the X axis, and I'm going to add the daily high Tesla stock price to my Y axis.&#x20;

![A line chart of time series data](<../.gitbook/assets/Screen Shot 2022-03-23 at 3.45.00 PM.png>)

For more detailed information about graphing, see the [graph reference page](../how-to/graphing.md).&#x20;

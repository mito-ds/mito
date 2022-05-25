---
description: This documentation explains how to create presentation-ready graphs in Mito.
---

# Graphing

Graphing in Mito is designed to help you build intuition about your data and create presentation-ready graphs to communicate insights. Mito creates interactive and customizable graphs using the [Plotly Express](https://plotly.com/python/plotly-express/) open source graphing library. &#x20;

Like everything in Mito, when you create a graph, Mito generates the equivalent Python code so have complete control of your analysis.&#x20;

{% embed url="https://youtu.be/JsXVfuttcEY" %}
Creating a graph in Mito
{% endembed %}

### Creating a new graph

The `Graph` button in the Mito toolbar will create a new graph in Mito.&#x20;

### Setting up the graph

`Data Source`: The sheet that contains the data that you want to graph.&#x20;

`Chart Type`: The type of graph that you want to create. Mito supports:&#x20;

* [Scatter plots](https://plotly.com/python/line-and-scatter/)
* [Line charts](https://plotly.com/python/line-charts/)
* [Bar charts](https://plotly.com/python/bar-charts/)
* [Histograms](https://plotly.com/python/histograms/)
* [Box plots](https://plotly.com/python/box-plots/)
* [Violin plots](https://plotly.com/python/violin/)
* [Strip plots](https://plotly.com/python/strip-charts/)
* [Density heatmaps](https://plotly.com/python/2D-Histogram/)
* [Density Countour maps](https://plotly.com/python/2d-histogram-contour/)
* [ECDF (Emprical Cumulative Distribution Function) graphs](https://plotly.com/python/ecdf-plots/)

`X Axis`: The data to graph along the x axis.&#x20;

* You can select multiple series either along the x or y axis (not both) as long as the series have similar dtypes.&#x20;

`Y Axis`: The data to graph along the y axis.&#x20;

* You can select multiple series either along the x or y axis (not both) as long as the series have similar dtypes.&#x20;

`Color by Column`: An additional column to further breakdown the graphed data using the color attribute.&#x20;

* For best results, select a column with few unique values.&#x20;
* This option is selectable for all graphs expect the `Density heatmap`.

`Filter to safe size`: By default, Mito only graphs the first 1000 rows of data to ensure that the browser tab doesn't crash while attempting to load too much data into the graph. Turning off filter to save size graphs the entire dataframe and may slow down or crash your browser tab.

![Setting up a graph in Mito](<../.gitbook/assets/Screen Shot 2022-03-23 at 2.40.09 PM.png>)

### Styling a graph

#### Title&#x20;

`Title`: The main title of the graph

`Display Title`: Toggle to OFF to remove the title from the graph. Toggle to ON to display the title of the graph.

`Title Color`: <img src="../.gitbook/assets/Pro Logo(1) (1) (1) (1) (1).png" alt="" data-size="line"> The color of the title (only availabe in Mito Pro).&#x20;

#### X Axis

`Title`: The title of the x axis.

`Display Title`: Toggle to OFF to remove the title from the x axis. Toggle to ON to display the title on the x axis.

`X axis title color`: <img src="../.gitbook/assets/Pro Logo(1) (1) (1) (1) (1).png" alt="" data-size="line"> The color of the x axis title (only available in Mito Pro).&#x20;

`Display range slider`: The range slider is a horizontal bar underneath the x axis of the graph that can be used to zoom in on specific ranges of the graph. Toggle to OFF to remove the range slider. Toggle on ON to display the range slider.&#x20;

#### Y Axis

`Title`: The title of the y axis.

`Display Title`: Toggle to OFF to remove the title from the y axis. Toggle to ON to display the title on the y axis.

`Y axis title color`: <img src="../.gitbook/assets/Pro Logo(1) (1) (1) (1) (1).png" alt="" data-size="line"> The color of the y axis title (only available in Mito Pro).&#x20;

#### Colors <img src="../.gitbook/assets/Pro Logo(1) (1) (1) (1) (1).png" alt="" data-size="line">&#x20;

`Plot Background Color`:  <img src="../.gitbook/assets/Pro Logo(1) (1) (1) (1) (1).png" alt="" data-size="line"> The background color of the area inside of the graph. (only available in Mito Pro)

`Paper Background Color`: <img src="../.gitbook/assets/Pro Logo(1) (1) (1) (1) (1).png" alt="" data-size="line"> The background color of the area outside the graph. (only available in Mito Pro)&#x20;

![Styling a graph in Mito](<../.gitbook/assets/Screen Shot 2022-03-23 at 2.58.59 PM.png>)

### Exporting a graph

`Copy Graph Code`: Copy the Plotly graph code to your clipboard so you can paste it into a code cell.&#x20;

`Download as PNG`: Download the graph as a PNG.

![Exporting a graph in Mito](<../.gitbook/assets/Screen Shot 2022-03-23 at 3.05.12 PM.png>)


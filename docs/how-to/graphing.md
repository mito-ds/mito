---
description: This documentation explains how to create exploratory graphs in Mito.
---

# Graphing

{% embed url="https://youtu.be/LG-NoFdEZAI" %}


Mito's graphing functionality is designed to help you explore your dataset. By supporting Plotly graphs, Mito users can create interactive graphs, drill down on data points inside those graphs, and zoom in/out to see the right amount of detail.&#x20;

Mito graphs come in many shapes and sizes. Mito currently supports the graph types:
1. Scatter 
2. Line
3. Bar
4. Histogram
5. Box
6. Violin
7. Strip
8. ECDF (Empirical Cumulative Distribution Function)
9. Density heatmap
10. Density Contour

You can add mulitple columns to an axis to better understand your data. For example, creating a stacked graph is a helpful tool for identifying relationships between series along a common attribute.&#x20;

To create a graph, click the **Graph** button in the Mito toolbar. In the the graph sidebar that appears, use the configuration settings to create the graph. Use the **select dropdowns** to set the chart type and add series to each axis.

![](<../.gitbook/assets/final mito graphing.png>)

You can also set a **Color By Column**, which will add colors to the graph based on the values of the column you select. This option is selectable for all graphs expect the `Density heatmap`. 

To save the graph and/or make further customizations to the graph, export the Plotly express graph code using the **copy graph code** button at the bottom of the graphing taskpane. Paste the graph code into a Jupyter notebook cell and use [Plotly documentation](https://plotly.com/python/plotly-express/) to customize it. 


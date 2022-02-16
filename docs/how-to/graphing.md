---
description: This documentation explains how to create exploratory graphs in Mito.
---

# Graphing

{% embed url="https://youtu.be/LG-NoFdEZAI" %}



Mito's graphing functionality is designed to help you explore your dataset. By supporting Plotly graphs, Mito users can create interactive graphs, drill down on data points inside those graphs, and zoom in/out to see the right amount of detail.&#x20;

Mito graphs come in many shapes and sizes (literally!). Mito supports bar charts, box plots, histograms, and scatter plots. Mito/Plotly graphs also support adding multiple series to each axis. For example, creating a stacked graph is a helpful tool for identifying relationships between series along a common attribute.&#x20;

To create a graph, click the **Graph** button in the Mito toolbar. In the the graph sidebar that appears, use the configuration settings to create the graph. Use the **select dropdowns** to set the chart type and add series to each axis.

The grey subtext that may appear in the graph sidebar will explain why certain functionality may/may not yet be supported, and provide you a way to request new graphing features. &#x20;

![](<../.gitbook/assets/final mito graphing.png>)

To save the graph and/or make further customizations to the graph, export the Plotly express graph code using the **copy graph code** button at the bottom of the graphing taskpane. Paste the graph code into a Jupyter notebook cell and use [Plotly documentation](https://plotly.com/python/plotly-express/) to customize it. 


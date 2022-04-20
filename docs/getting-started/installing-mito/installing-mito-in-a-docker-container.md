---
description: Instructions for using Mito with Docker.
---

# Installing Mito in a Docker Container

## Before Installing Mito

1. Verify that the docker image is using **Python 3.7** or greater.
2. Ensure that the docker image can use classic Jupyter Notebooks or JupyterLab 3.x.

## Installing Mito

Add the following command to your docker file:

```
RUN pip install --no-cache-dir mitosheet
RUN jupyter nbextension install mitosheet
RUN jupyter nbextension enable mitosheet
```

Then, after you launch this container, you can run a classic Jupyter Notebook or JupyterLab instance and create a mitosheet with the following standard instructions.

{% content-ref url="../../how-to/creating-a-mitosheet/" %}
[creating-a-mitosheet](../../how-to/creating-a-mitosheet/)
{% endcontent-ref %}

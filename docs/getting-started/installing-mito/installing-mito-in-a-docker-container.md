---
description: Instructions for using Mito with Docker.
---

# Installing Mito in a Docker Container

## Before Installing Mito

1. Verify that the docker image is using **Python 3.7** or greater.
2. Ensure that the docker image can use JupyterLab 3.0.

## Installing Mito

Add the following command to your docker file:

```
RUN pip install --no-cache-dir mitosheet
```

Then, after you launch this container and run a **JupyterLab** instance, you should be able to create a Mitosheet following the standard instructions.

{% content-ref url="../../how-to/creating-a-mitosheet/" %}
[creating-a-mitosheet](../../how-to/creating-a-mitosheet/)
{% endcontent-ref %}

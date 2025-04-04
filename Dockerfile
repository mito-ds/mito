# Use the official JupyterLab image as base
FROM quay.io/jupyter/minimal-notebook:lab-4.3.6

# Install mitosheet and mito-ai
RUN pip install mitosheet mito-ai
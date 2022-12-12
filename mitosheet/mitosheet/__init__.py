#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
The Mito package, which contains functions for creating a Mito sheet. 

To generate a new sheet, simply run:

import mitosheet
mitosheet.sheet()

If running mitosheet.sheet() just prints text that looks like `MitoWidget(...`, then you need to 
install the JupyterLab extension manager by running:

jupyter labextension install @jupyter-widgets/jupyterlab-manager@2;

Run this command in the terminal where you installed Mito. It should take 5-10 minutes to complete.

Then, restart your JupyterLab instance, and refresh your browser. Mito should now render.

NOTE: if you have any issues with installation, please email jake@sagacollab.com
"""

import os
import pandas as pd

from mitosheet.telemetry.telemetry_utils import log
from mitosheet.user import initialize_user
from mitosheet.mito_backend import MitoBackend, sheet
from mitosheet.saved_analyses import register_analysis
from mitosheet.errors import MitoError
from mitosheet._version import __version__
from mitosheet.column_headers import flatten_column_header

# We export depricated utilities, so that users can still use them if they used to
from mitosheet.step_performers.bulk_old_rename.deprecated_utils import (
    make_valid_header_external as make_valid_header,
)

# Export all the sheet functions
from mitosheet.sheet_functions import *

# And the functions for changing types
from mitosheet.sheet_functions.types import *

# Export the graph filtering code with a deprecation warning, so that it can be used in the code that generates graphs
from mitosheet.api.get_column_summary_graph import (
    filter_df_to_safe_size_external as filter_df_to_safe_size,
)

# Make sure the user is initalized
initialize_user()

# This function is only necessary for mitosheet3, as it is used
# in jlab3 to find the extension. It is not used in jlab2
def _jupyter_labextension_paths():
    """Called by jupyterlab to load the extension"""
    return [{"src": "labextension", "dest": "mitosheet"}]


def _jupyter_nbextension_paths():
    """Called by Jupyter Notebook Server to detect if it is a valid nbextension and
    to install the widget

    Returns
    =======
    section: The section of the Jupyter Notebook Server to change.
        Must be 'notebook' for widget extensions
    src: Source directory name to copy files from. Webpack outputs generated files
        into this directory and Jupyter Notebook copies from this directory during
        widget installation
    dest: Destination directory name to install widget files to. Jupyter Notebook copies
        from `src` directory into <jupyter path>/nbextensions/<dest> directory
        during widget installation
    require: Path to importable AMD Javascript module inside the
        <jupyter path>/nbextensions/<dest> directory
    """
    return [{
        'section': 'notebook',
        'src': 'nbextension',
        'dest': 'mitosheet',
        'require': 'mitosheet/extension'
    }]
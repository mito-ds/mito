#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
The Mito package, which contains functions for creating a Mito sheet. 

To generate a new sheet, simply run:

import mitosheet
mitosheet.sheet()

If running the mitosheet.sheet() call does not work, try restarting your JupyterLab instance, refreshing your browser, and trying again. 

If it still does not work, please email jake@sagacollab.com
"""

# Public interface we want users to rely on
from mitosheet.dataframe_display_formatters import set_dataframe_display_formatters
from mitosheet.mito_backend import sheet
from mitosheet._version import __version__

# NOTE: We always export v1 sheet functions and types as unqualified exports, as we did
# this when we started Mito. This allows us to not break existing user analyses. We should
# never add to these -- see mitosheet/public/README.md for more info
from mitosheet.public.v1 import register_analysis
from mitosheet.public.v1.sheet_functions import *
from mitosheet.public.v1.sheet_functions.types import *
from mitosheet.public.v1.utils import flatten_column_header

# We export depricated utilities, so that users can still use them if they used to
from mitosheet.api.get_column_summary_graph import (
    filter_df_to_safe_size_external as filter_df_to_safe_size,
)
from mitosheet.step_performers.bulk_old_rename.deprecated_utils import (
    make_valid_header_external as make_valid_header,
)

# Make sure the user is initalized
from mitosheet.user import initialize_user
initialize_user()

# Make the Mitosheet the default dataframe display
set_dataframe_display_formatters()


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

"""
Dash Integration below. 

These are the files that are loaded by the Dash app. Notably, these need to be defined in the root __init__.py file,
as Dash will look for them there. 

The namespace stuff is a bit confusing, as well, but here's what's my current understanding is:
1. These files are loaded by Dash, and they need to be loaded by the root __init__.py file
2. The namespace in these files must be the package name, which is mitosheet
3. The _namespace in the Dash spreadsheet component must be the same as the globalName in the esbuild for dash - this is how it knows to call the right function
"""

_js_dist = [
    {'relative_package_path': 'mito_dash/v1/mitoBuild/component.js', 'namespace': 'mitosheet'}, 
    {'relative_package_path': 'mito_dash/v1/mitoBuild/component.js.map', 'namespace': 'mitosheet', 'dynamic': True}
]

_css_dist = [
    {'relative_package_path': 'mito_dash/v1/mitoBuild/component.css', 'namespace': 'mitosheet'}, 
]

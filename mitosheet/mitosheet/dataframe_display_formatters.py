# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
This code is responsible for making mitosheet the default dataframe display when Jupyter
is rendering a dataframe to the output cell.

The new approach add a new custom mimetype to hook a custom viewer. This allows to keep
the default view if the user prefers it.

_____

Previous approaches:

This approach works by overriding the default HTML and plain text formatters for pandas DataFrames in IPython.
When a DataFrame is displayed, the custom formatter functions are called, which in turn call mitosheet.sheet()
to render the DataFrame using mitosheet.

In order for the custom renderers to work, the mitosheet package must first be imported in the user's kernel.
To do so, when the Mito extension is activated, we register a kernel status listener that imports the mitosheet package
whenever the kernel changes.

This approach still fails the race condition caused when the user clicks "Restart Kernel and run all cells".
When doing so, the `import mitosheet` does not get executed until after all of the code cells have been executed.
Which means that the mitosheet package is not imported when rendering any dataframes in the notebook. In
this case, we just default to the pandas dataframe renderer. That is okay.

Before landing on this approach, we tried to create a custom dataframe mime renderer. Using the mime renderer
did not work because:

In order to create the mitosheet, we need to execute the mitosheet.sheet() function. To do so, we
had to send a new kernel message from the mimerender with the code mitosheet.sheet(df). However, becasue
the kernel message queue might have had additional messages already queued that edited the df, by the time
the mitosheet was rendered, it might have displayed a dataframe that reflected future code cell edits instead of the
current state of the dataframe at the time the code cell with the hanging df was executed. This is not what we want.

For a more thorough explanation of attempted solutions, see the comment here: https://github.com/mito-ds/mito/pull/1330#issuecomment-2386428760
"""

from .formatter import register_ipython_formatter


def set_dataframe_display_formatters() -> None:
    """
    Deprecated

    The registration of a custom formatter is now done automatically by the
    mitosheet plugin.
    """
    register_ipython_formatter()

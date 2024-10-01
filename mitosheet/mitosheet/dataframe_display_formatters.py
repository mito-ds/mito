
"""
    This code is responsible for making mitosheet the default dataframe display when Jupyter 
    is rendering a dataframe to the output cell. 

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

    _____

    Previous approaches: 
    
    Before landing on this approach, we tried to create a custom dataframe mime renderer. Using the mime renderer
    did not work because: 

    In order to create the mitosheet, we need to execute the mitosheet.sheet() function. To do so, we 
    had to send a new kernel message from the mimerender with the code mitosheet.sheet(df). However, becasue
    the kernel message queue might have had additional messages already queued that edited the df, by the time
    the mitosheet was rendered, it might have displayed a dataframe that reflected future code cell edits instead of the
    current state of the dataframe at the time the code cell with the hanging df was executed. This is not what we want. 

    For a more thorough explanation of attempted solutions, see the comment here: https://github.com/mito-ds/mito/pull/1330#issuecomment-2386428760
    """

def set_dataframe_display_formatters():
    try: 
        # Since Mito is used in Streamlit which is not a iPython enviornment, 
        # we just wrap this entire thing in a try, except statement 

        from IPython import get_ipython
        import pandas as pd
        import mitosheet

        # Updated formatter functions with correct signatures
        def mitosheet_display_formatter(obj, include=None, exclude=None):
            if isinstance(obj, pd.DataFrame):
                return mitosheet.sheet(obj, input_cell_execution_count = ip.execution_count)
            return None  # Let other types use the default formatter

        def mitosheet_plain_formatter(obj, p, cycle):
            if isinstance(obj, pd.DataFrame):
                return ''  # Prevent default text representation
            return None  # Let other types use the default formatter

        ip = get_ipython()
        html_formatter = ip.display_formatter.formatters['text/html']
        plain_formatter = ip.display_formatter.formatters['text/plain']

        # Save the original formatters
        set_dataframe_display_formatters.original_html_formatter = html_formatter.for_type(pd.DataFrame)
        set_dataframe_display_formatters.original_plain_formatter = plain_formatter.for_type(pd.DataFrame)

        # Register the custom formatters
        html_formatter.for_type(pd.DataFrame, mitosheet_display_formatter)
        plain_formatter.for_type(pd.DataFrame, mitosheet_plain_formatter)
    
    except:
        pass
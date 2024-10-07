
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

def set_dataframe_display_formatters() -> None:

    try: 
        # Since Mito is used in Streamlit which is not a iPython enviornment, 
        # we just wrap this entire thing in a try, except statement 

        from IPython import get_ipython
        import pandas as pd
        import mitosheet

        # Custom HTML formatter for DataFrames using Mitosheet
        def mitosheet_display_formatter(obj, include=None, exclude=None):
            if isinstance(obj, pd.DataFrame):
                # Render the DataFrame using Mitosheet
                return mitosheet.sheet(obj, input_cell_execution_count=ip.execution_count)
            # Returning None tells Jupyter that this formatter (the text/html one) didn’t produce any output for the given object.
            # This causes Jupyter to “fall back” to lower-priority formatters (like text/plain).
            return None

        # Custom plain text formatter to suppress plain text for DataFrames
        def mitosheet_plain_formatter(obj, p, cycle):
            # TODO: I'm not 100% confident that this is correct, but if I don't overwrite the plain text formatter
            # for dataframes, then I end up getting the mitosheet followed by a printed version of the dataframe.
            if isinstance(obj, pd.DataFrame):
                # Returning None here tells Jupyter not to render anything in the text/plain format 
                # for DataFrames. In this case, Jupyter has already rendered the text/html output, 
                # so returning None for text/plain means “suppress this output,” 
                # preventing Jupyter from rendering the plain text fallback.
                return None
            # For other objects, use the default plain text formatter
            return p.text(obj)

        ip = get_ipython() # type: ignore
        html_formatter = ip.display_formatter.formatters['text/html']
        plain_formatter = ip.display_formatter.formatters['text/plain']

        # Register the custom formatters
        html_formatter.for_type(pd.DataFrame, mitosheet_display_formatter)
        plain_formatter.for_type(pd.DataFrame, mitosheet_plain_formatter)
    
    except:
        pass
import os

IPYTHON_STARTUP_FOLDER = os.path.join(os.path.expanduser("~"), '.ipython', 'profile_default', 'startup')
IMPORT_MITOSHEET_FILE_PATH = os.path.join(IPYTHON_STARTUP_FOLDER, 'import_mitosheet.py')

# IMPORT_MITOSHEET_FILE_CONTENTS is the startup script used to display the 'View in Mito' button
# in the output of the pandas dataframe display in Jupyter Lab. 
# 
# It accomplishes this by registering a formatter for pandas dataframes. 
# The formatter packages the 'View in Mito' button to the html of the dataframe 
# and uses a script tag to make the button visible only when window.commands 
# contains the 'create-mitosheet-from-dataframe-output' function, which is required to 
# create the mitosheet. Otherwise, the button's display is set to none.

IMPORT_MITOSHEET_FILE_CONTENTS = """
try:
\timport mitosheet
\timport pandas as pd
\timport uuid

\tdef add_mito_button_to_df_output(obj):
\t\tbutton_uuid = uuid.uuid4()
\t\ttry:
\t\t\tmax_rows = pd.get_option('display.min_rows') # NOTE: this is due to https://github.com/pandas-dev/pandas/issues/44304
\t\t\tmax_cols = pd.get_option('display.max_columns')
\t\texcept:
\t\t\tmax_rows = 10
\t\t\tmax_cols = 20
\t\treturn f'<div><div id={button_uuid} style="display:none; background-color:#9D6CFF; color:white; width:200px; height:30px; padding-left:5px; border-radius:4px; flex-direction:row; justify-content:space-around; align-items:center;" onmouseover="this.style.backgroundColor=\\'#BA9BF8\\'" onmouseout="this.style.backgroundColor=\\'#9D6CFF\\'" onclick="window.commands?.execute(\\'create-mitosheet-from-dataframe-output\\');">See Full Dataframe in Mito</div> <script> if (window.commands?.hasCommand(\\'create-mitosheet-from-dataframe-output\\')) document.getElementById(\\'{button_uuid}\\').style.display = \\'flex\\' </script> {obj.to_html(max_rows=max_rows, max_cols=max_cols)}</div>'

\thtml_formatter = get_ipython().display_formatter.formatters['text/html']
\thtml_formatter.for_type(pd.DataFrame, add_mito_button_to_df_output)
except:
\tprint('Unable to automatically import mitosheet')
"""

def create_startup_file():
    """
    Adds a file import_mitosheet.py to the user's IPython startup folder 
    so that Mito is automatically imported everytime they start an IPython kernel. 

    This allows us to display a button in the user's pandas dataframe output that 
    lets them open the dataframe in Mito.
    """

    # Create the startup folder if it does not exist
    if not os.path.exists(IPYTHON_STARTUP_FOLDER):
        os.makedirs(IPYTHON_STARTUP_FOLDER)
        
    # Create the import mitosheet file
    with open(IMPORT_MITOSHEET_FILE_PATH, 'w+') as f:
        # And write the default object
        f.write(IMPORT_MITOSHEET_FILE_CONTENTS)



import json
import os
import sys
from mitosheet.telemetry.telemetry_utils import log
import analytics

MITO_STARTER_NOTEBOOK_PATH = './mito-starter-notebook.ipynb'
MITO_STARTER_NOTEBOOK_CONTENTS = {
 "cells": [
  {
   "cell_type": "code",
   "execution_count": None,
   "id": "c0957234-ba57-4199-adfa-9d17ede0b8f9",
   "metadata": {},
   "outputs": [],
   "source": [
    "# Run this cell to render a mitosheet\n",
    "# See mito's documentation here: https://docs.trymito.io/how-to/creating-a-mitosheet\n",
    "# Join our Discord for support here: https://discord.com/invite/XdJSZyejJU\n"
    "\n",
    "import mitosheet\n",
    "mitosheet.sheet()"
   ]
  }
 ],
 "metadata": {
  "kernelspec": {
   "display_name": "Python 3 (ipykernel)",
   "language": "python",
   "name": "python3"
  },
  "language_info": {
   "codemirror_mode": {
    "name": "ipython",
    "version": 3
   },
   "file_extension": ".py",
   "mimetype": "text/x-python",
   "name": "python",
   "nbconvert_exporter": "python",
   "pygments_lexer": "ipython3",
   "version": "3.8.5"
  },
  "widgets": {
   "application/vnd.jupyter.widget-state+json": {
    "state": {},
    "version_major": 2,
    "version_minor": 0
   }
  }
 },
 "nbformat": 4,
 "nbformat_minor": 5
}

def try_create_starter_notebook():
    """
    Creates MITO_STARTER_NOTEBOOK_CONTENTS at MITO_STARTER_NOTEBOOK_PATH,
    which helps the user get started.

    If the file already exists, will not replace it, as to not overwrite
    users work in this area.
    """
    try:
        if not os.path.exists(MITO_STARTER_NOTEBOOK_PATH):
            with open(MITO_STARTER_NOTEBOOK_PATH, 'w+') as f:
                f.write(json.dumps(MITO_STARTER_NOTEBOOK_CONTENTS))
                
        return True
    except Exception as e:
        log(
            'hello_command_try_create_starter_notebook_error', 
            failed=True,
            error=e
        )
        # TODO: add a log
        return False



def run_hello():
    log('hello_command')

    print()
    print()
    print("\t 👋 Welcome to Mito!")
    print()
    print("\tThis command launches Mito in JupyterLab, but Mito is also available in Jupyter Notebook Classic, Streamlit, and Dash.")
    print()
    print("\tSee our docs here: https://docs.trymito.io")
    print()
    print()

    created_starter_notebook = try_create_starter_notebook()

    if not created_starter_notebook:
        print(f"Did not have the permissions to create a starter notebook. Check our instructions for creating a new Mitosheet at: https://docs.trymito.io/how-to/creating-a-mitosheet")
        exit(1)

    log('hello_command_success')

    # Flush any logs
    analytics.flush()

    # Launch JupyterLab
    os.execl(sys.executable, 'python', '-m', 'jupyter', 'lab', MITO_STARTER_NOTEBOOK_PATH)

    

    
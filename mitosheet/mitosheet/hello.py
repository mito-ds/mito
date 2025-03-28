# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

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

def try_create_starter_notebook() -> bool:
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
        log('hello_command_create_starter_notebook')
        return True
    except Exception as e:
        log(
            'hello_command_create_starter_notebook_error', 
            failed=True,
            error=e
        )
        return False



def run_hello() -> None:
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

    try_create_starter_notebook()

    # Flush any logs
    analytics.flush()

    # Launch JupyterLab
    try:
        os.execl(sys.executable, 'python', '-m', 'jupyter', 'lab', MITO_STARTER_NOTEBOOK_PATH)
    except Exception as e:
        log('hello_command_start_jupyterlab_error', error=e, failed=True)

    # Flush any logs, again
    analytics.flush()

    

    
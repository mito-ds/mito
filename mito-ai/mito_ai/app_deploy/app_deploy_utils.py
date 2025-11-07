# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import zipfile
import logging
from typing import List, Optional

from mito_ai.path_utils import AbsoluteNotebookDirPath

def add_files_to_zip(
    zip_path: str, 
    notebook_dir_path: AbsoluteNotebookDirPath,
    files_to_add: List[str], 
    app_file_name: str,
    logger: Optional[logging.Logger] = None
) -> None:
    """Create a zip file at zip_path and add the selected files/folders."""
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for file_to_add_rel_path in files_to_add:
            
            file_to_add_abs_path = os.path.join(notebook_dir_path, file_to_add_rel_path)

            if os.path.isfile(file_to_add_abs_path):
                basename = os.path.basename(file_to_add_abs_path)
                
                if basename == app_file_name:
                    # For the actual app file, we want to write it just as app.py 
                    # so our infra can always deploy using `streamlit run app.py`
                    # without having to account for different app names
                    zipf.write(file_to_add_abs_path, arcname='app.py')
                else:
                    # otherwise we want to keep the name as is so all references
                    # to it from the app are correct
                    zipf.write(file_to_add_abs_path, arcname=file_to_add_rel_path)
            elif os.path.isdir(file_to_add_abs_path):
                for root, _, files in os.walk(file_to_add_abs_path):
                    for file in files:
                        file_abs = os.path.join(root, file)
                        arcname = os.path.relpath(file_abs, notebook_dir_path)
                        zipf.write(file_abs, arcname=arcname)
            else:
                if logger:
                    logger.warning(f"Skipping missing file: {file_to_add_abs_path}")

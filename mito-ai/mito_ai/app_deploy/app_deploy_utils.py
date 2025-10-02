# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import zipfile
import logging
from typing import List, Optional

def add_files_to_zip(zip_path: str, base_path: str, files_to_add: List[str], logger: Optional[logging.Logger] = None) -> None:
    """Create a zip file at zip_path and add the selected files/folders."""
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for rel_path in files_to_add:
            abs_path = os.path.join(base_path, rel_path)

            if os.path.isfile(abs_path):
                zipf.write(abs_path, arcname=rel_path)
            elif os.path.isdir(abs_path):
                for root, _, files in os.walk(abs_path):
                    for file in files:
                        file_abs = os.path.join(root, file)
                        arcname = os.path.relpath(file_abs, base_path)
                        zipf.write(file_abs, arcname=arcname)
            else:
                if logger:
                    logger.warning(f"Skipping missing file: {abs_path}")

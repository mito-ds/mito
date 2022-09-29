


import sys
import time
import os
from typing import List

from mitoinstaller.installer_steps.installer_step import InstallerStep


def get_installer_start_message() -> str:

    # First, build the checklist of the completed steps

    is_install = 'install' in sys.argv

    if is_install:
        return 'Starting Mito install. This make take a few moments.\n\nIn the meantime, check out a 2 minute intro to Mito: https://www.youtube.com/watch?v=LFfWfqzdKyE\n'
    else: 
        return 'Starting Mito upgrade. This make take a few moments.\n\nIn the meantime, check out our docs: https://docs.trymito.io\n'
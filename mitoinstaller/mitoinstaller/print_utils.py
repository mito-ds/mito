


import time
import os
from typing import List

from mitoinstaller.installer_steps.installer_step import InstallerStep

def clear_terminal():
    os.system('cls' if os.name == 'nt' else 'clear')

def clear_and_print(message: str):
    clear_terminal()
    print(message)

# We change up the message we display to the user every 10 seconds, so that they are
# are aware of the progress of the install and that it is not frozen.
STILL_RUNNING_MESSAGES = [
    'Running...',
    'Still running...',
    'This can take a while...',
    'This is taking a while...',
    'Still running...',
    'Working...',
    'Still working...',
    'Hoping to finish soon...',
    'Hopefully finishing soon...',
    'Still working...',
    'Still running...',
]


def print_current_installer_message(installer_steps: List[InstallerStep], finished_index: int, start_time: float) -> str:

    # First, build the checklist of the completed steps

    final_string = 'Starting Mito install. This make take a few moments. In the meantime, check out a 2 minute intro to Mito: <VIDEO LINK HERE>\n\n'

    running_for = time.perf_counter() - start_time

    for index, installer_step in enumerate(installer_steps):
        checked = index <= finished_index
        running = index == finished_index + 1
    
        final_string += f' [{"X" if checked else " "}] ' + installer_step.installer_step_name
        if running:
            final_string += f' ({STILL_RUNNING_MESSAGES[int((running_for // 10)) % len(STILL_RUNNING_MESSAGES)]})'

        final_string += '\n'


    clear_and_print(final_string)
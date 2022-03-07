
from typing import Callable

from mitoinstaller.log_utils import log, log_error


class InstallerStep:
    """
    An installer step is a specific step in an install/upgrade process,
    that currently has a name and a function that executes when it runs.

    If you label a step as optional, then although this step may fail,
    it will not stop the InstallerSteps after it from executing.

    NOTE: install steps themselves should not log anything. All the logging
    is handeled by the run_installer_steps function, which dramatically
    clarifies when things go wrong.
    """
    def __init__(self, 
        installer_step_name: str, 
        execution_function: Callable,
        optional: bool=False
    ):
        self.installer_step_name = installer_step_name
        self.execution_function = execution_function
        self.optional = optional

    @property
    def event_name(self):
        return self.installer_step_name.replace(' ', '_').lower()
    
    def execute(self) -> None:
        self.execution_function()

    def log_failure(self) -> None:
        log_error(self.event_name + '_failed')

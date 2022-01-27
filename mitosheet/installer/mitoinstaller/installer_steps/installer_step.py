
from typing import Callable


class InstallerStep:
    """
    An installer step is a specific step in an install/upgrade process,
    that currently has a name and a function that executes when it runs.

    If you label a step as optional, then although this step may fail,
    it will not stop the InstallerSteps after it from executing.
    """
    def __init__(self, 
        installer_step_name: str, 
        execution_function: Callable,
        optional: bool=False
    ):
        self.installer_step_name = installer_step_name
        self.execution_function = execution_function
        self.optional = optional
    
    def execute(self):
        self.execution_function()

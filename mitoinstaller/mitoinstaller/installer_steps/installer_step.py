
from time import perf_counter
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
        optional: bool=False,
        should_log_success: bool=False
    ):
        self.installer_step_name = installer_step_name
        self.execution_function = execution_function
        self.optional = optional
        self.should_log_success = should_log_success
        
    @property
    def event_name(self):
        return self.installer_step_name.replace(' ', '_').lower()
    
    def execute(self) -> None:
        self.execution_function()

    def log_success(self, start_time: float) -> None:
        processing_time = perf_counter() - start_time
        log(self.event_name + '_success', {
            'processing_time': round(processing_time, 1),
            'processing_time_seconds': round(processing_time, 0),
            'processing_time_seconds_ten': round(processing_time, -1),
            'processing_time_seconds_hundred': round(processing_time, -2),
        })
    
    def log_failure(self) -> None:
        log_error(self.event_name + '_failed')

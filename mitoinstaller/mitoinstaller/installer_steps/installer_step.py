
from time import perf_counter
from typing import Callable
from mitoinstaller.commands import exit_after_error

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
        should_log_success: bool=False,
        no_print_in_main_loop: bool=False, # Set to True if you don't want to print this step in the main loop
    ):
        self.installer_step_name = installer_step_name
        self.execution_function = execution_function
        self.optional = optional
        self.should_log_success = should_log_success
        self.no_print_in_main_loop = no_print_in_main_loop
        
    @property
    def event_name(self):
        return self.installer_step_name.replace(' ', '_').lower()
    
    def execute(self) -> None:

        # Measure the start time so we can see how long this took
        start_time = perf_counter()

        try:
            self.execution_function()

            # We always log success so we can see how long it took, among other things
            self.log_success(start_time)
        except:
            # Log that we failed on this step
            self.log_failure()

            # If the install step is not optional, log that the install failed and exit
            # with an error message for the user
            if not self.optional:
                # Do one major log if we fail, so that we can easily tell what happened
                log_error('install_failed', {'installer_step_name': self.installer_step_name})
                exit_after_error()


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

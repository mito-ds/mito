# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from abc import ABC, abstractmethod
from typing import Any, Dict, Collection, List, Optional, Tuple

from mitosheet.types import StepsManagerType


class PreprocessStepPerformer(ABC, object):
    """
    The abstract base class for a preprocess step, which 
    executes at the start of the analysis on the arguments
    passed to the mitosheet.sheet call
    """

    @classmethod
    @abstractmethod
    def preprocess_step_version(cls) -> int:
        """
        Returns the version of the step. Changes when the parameters
        of the step change.
        """
        pass

    @classmethod
    @abstractmethod
    def preprocess_step_type(cls) -> str:
        """
        The name of the step used internally. If you change this, you must upgrade
        the step and bump the version.
        """
        pass

    @classmethod
    @abstractmethod
    def execute(cls, args: Collection[Any]) -> Tuple[List[Any], Optional[List[str]], Optional[Dict[str, Any]]]:
        """
        Execute always returns the new list of arguments, as well as the names of these arguements, as well as execution_data
        for this preprocess step.
        """
        pass

    @classmethod
    @abstractmethod
    def transpile(cls, steps_manager: StepsManagerType, execution_data: Optional[Dict[str, Any]]) -> Tuple[List[str], List[str]]:
        """
        Returns a list of the Python code lines that corresponds to this 
        preprocess step being executed
        """
        pass

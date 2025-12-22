# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.completions.prompt_builders.prompt_section_registry.base import PromptSection


from typing import List, Type
from .files import FilesSection
from .variables import VariablesSection
from .active_cell_code import ActiveCellCodeSection
from .notebook import NotebookSection
from .active_cell_id import ActiveCellIdSection
from .active_cell_output import ActiveCellOutputSection
from .get_cell_output_tool_response import GetCellOutputToolResponseSection
from .streamlit_app_status import StreamlitAppStatusSection
from .selected_context import SelectedContextSection
from .rules import RulesSection
from .task import TaskSection
from .error_traceback import ErrorTracebackSection
from .example import ExampleSection
from .generic import GenericSection
from .base import Prompt, PromptSection


class SectionRegistry:
    """Namespace for easy section construction."""
    Files = FilesSection
    Variables = VariablesSection
    ActiveCellCode = ActiveCellCodeSection
    Notebook = NotebookSection
    ActiveCellId = ActiveCellIdSection
    ActiveCellOutput = ActiveCellOutputSection
    GetCellOutputToolResponse = GetCellOutputToolResponseSection
    StreamlitAppStatus = StreamlitAppStatusSection
    SelectedContext = SelectedContextSection
    Rules = RulesSection
    Task = TaskSection
    ErrorTraceback = ErrorTracebackSection
    Example = ExampleSection
    Generic = GenericSection


# Export as SG (Section Generator) for easy usage
SG = SectionRegistry()

# Also export function to get all section classes for trimming
def get_all_section_classes() -> List[Type[PromptSection]]:
    """Returns all section classes for building trimming mapping."""
    prompt_section_classes: List[Type[PromptSection]] = PromptSection.__subclasses__()
    return prompt_section_classes


def get_max_trim_after_messages() -> int:
    """
    Returns the maximum trim_after_messages value from all section classes.
    
    This is used for cache boundary calculation - we cache messages that are
    older than the max trim threshold, since those messages are stable and
    won't be edited anymore.
    
    Returns 0 if all sections have trim_after_messages = None.
    """
    section_classes = get_all_section_classes()
    max_value = 0
    for section_class in section_classes:
        trim_value = getattr(section_class, 'trim_after_messages', None)
        if trim_value is not None and trim_value > max_value:
            max_value = trim_value
    return max_value


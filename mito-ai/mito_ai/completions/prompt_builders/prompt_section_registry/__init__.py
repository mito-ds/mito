# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

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
def get_all_section_classes():
    """Returns all section classes for building trimming mapping."""
    import inspect
    section_classes = []
    for attr_value in SectionRegistry.__dict__.values():
        if inspect.isclass(attr_value) and issubclass(attr_value, PromptSection) and attr_value is not PromptSection:
            section_classes.append(attr_value)
    return section_classes


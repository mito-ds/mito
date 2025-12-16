# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .files import FilesSection
from .variables import VariablesSection
from .code import CodeSection
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
from .base import Prompt


class SectionRegistry:
    """Namespace for easy section construction."""
    Files = FilesSection
    Variables = VariablesSection
    Code = CodeSection
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


# Export as SG (Section Generator) for easy usage
SG = SectionRegistry()


# Also export function to get all section classes for trimming
def get_all_section_classes():
    """Returns all section classes for building trimming mapping."""
    return [
        FilesSection,
        VariablesSection,
        CodeSection,
        NotebookSection,
        ActiveCellIdSection,
        ActiveCellOutputSection,
        GetCellOutputToolResponseSection,
        StreamlitAppStatusSection,
        SelectedContextSection,
        RulesSection,
        TaskSection,
        ErrorTracebackSection,
        ExampleSection,
    ]


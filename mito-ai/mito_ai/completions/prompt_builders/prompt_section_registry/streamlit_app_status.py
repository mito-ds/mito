# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from .base import PromptSection


class StreamlitAppStatusSection(PromptSection):
    """Section for Streamlit app status."""
    trim_after_messages: int = 3


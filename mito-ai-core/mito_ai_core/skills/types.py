# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from abc import ABC, abstractmethod
from typing import ClassVar


class Skill(ABC):
    name: ClassVar[str]

    @property
    @abstractmethod
    def description(self) -> str:
        """Short summary shown in the available skills list."""

    @property
    def is_available(self) -> bool:
        return True

    @abstractmethod
    def get_content(self) -> str:
        """Return the skill instructions for the agent."""

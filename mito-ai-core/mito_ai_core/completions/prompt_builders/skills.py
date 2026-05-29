# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List

from mito_ai_core.skills.utils import list_available_skills


def format_available_skills() -> str:
    skills: List[str] = list_available_skills()
    if not skills:
        return "No skills are currently available."
    return "\n".join(f"- {name}" for name in skills)

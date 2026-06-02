# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai_core.skills.utils import get_available_skills


def format_available_skills() -> str:
    skills = get_available_skills()
    if not skills:
        return "No skills are currently available."
    return "\n".join(
        f"- {skill.name}: {skill.description}"
        for skill in sorted(skills.values(), key=lambda s: s.name)
    )

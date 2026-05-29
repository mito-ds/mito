# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai_core.skills.utils import SKILLS


def format_available_skills() -> str:
    if not SKILLS:
        return "No skills are currently available."
    return "\n".join(
        f"- {skill.name}: {skill.description}" for skill in sorted(SKILLS.values(), key=lambda s: s.name)
    )

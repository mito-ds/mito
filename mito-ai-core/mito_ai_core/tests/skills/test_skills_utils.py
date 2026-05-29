# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os

import pytest

from mito_ai_core.skills import utils as skills_utils
from mito_ai_core.skills.utils import get_skill, list_available_skills, read_skill


@pytest.fixture
def skills_dirs(tmp_path, monkeypatch):
    bundled_dir = tmp_path / "bundled"
    user_dir = tmp_path / "user"
    bundled_dir.mkdir()
    user_dir.mkdir()
    monkeypatch.setattr(skills_utils, "BUNDLED_SKILLS_DIR", str(bundled_dir))
    monkeypatch.setattr(skills_utils, "USER_SKILLS_DIR", str(user_dir))
    return bundled_dir, user_dir


class TestListAvailableSkills:
    def test_empty_when_no_skills(self, skills_dirs) -> None:
        assert list_available_skills() == []

    def test_lists_bundled_and_user_skills(self, skills_dirs) -> None:
        bundled_dir, user_dir = skills_dirs
        (bundled_dir / "excel_to_python.md").write_text("excel rules")
        (user_dir / "custom_skill.md").write_text("custom rules")
        assert list_available_skills() == ["custom_skill", "excel_to_python"]


class TestGetSkill:
    def test_user_skill_overrides_bundled(self, skills_dirs) -> None:
        bundled_dir, user_dir = skills_dirs
        (bundled_dir / "database_rules.md").write_text("bundled")
        (user_dir / "database_rules.md").write_text("user override")
        assert get_skill("database_rules") == "user override"

    def test_returns_none_for_missing_skill(self, skills_dirs) -> None:
        assert get_skill("missing") is None

    def test_rejects_path_traversal(self, skills_dirs) -> None:
        with pytest.raises(ValueError, match="invalid characters"):
            get_skill("../secrets")


class TestReadSkill:
    def test_returns_skill_content(self, skills_dirs) -> None:
        bundled_dir, _user_dir = skills_dirs
        (bundled_dir / "markdown_rules.md").write_text("# Markdown\nUse headings.")
        result = read_skill("markdown_rules")
        assert result.success
        assert result.tool_name == "read_skill"
        assert "Markdown" in (result.output or "")

    def test_returns_error_for_missing_skill(self, skills_dirs) -> None:
        result = read_skill("does_not_exist")
        assert not result.success
        assert "does_not_exist" in (result.error_message or "")
        assert "Available skills" in (result.error_message or "")

    def test_returns_error_for_invalid_name(self, skills_dirs) -> None:
        result = read_skill("../etc/passwd")
        assert not result.success
        assert result.error_message is not None

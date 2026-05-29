# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest

from mito_ai_core.skills import utils as skills_utils
from mito_ai_core.skills.utils import get_skill, list_available_skills, read_skill


def _write_skill(path, content: str) -> None:
    path.write_text(f'CONTENT = """{content}"""\n')


@pytest.fixture
def skills_dirs(tmp_path, monkeypatch):
    package_skills_dir = tmp_path / "package_skills"
    user_dir = tmp_path / "user"
    package_skills_dir.mkdir()
    user_dir.mkdir()
    monkeypatch.setattr(skills_utils, "SKILLS_DIR", str(package_skills_dir))
    monkeypatch.setattr(skills_utils, "USER_SKILLS_DIR", str(user_dir))
    return package_skills_dir, user_dir


class TestListAvailableSkills:
    def test_empty_when_no_skills(self, skills_dirs) -> None:
        assert list_available_skills() == []

    def test_lists_package_and_user_skills(self, skills_dirs) -> None:
        package_skills_dir, user_dir = skills_dirs
        _write_skill(package_skills_dir / "excel_to_python.py", "excel rules")
        _write_skill(user_dir / "custom_skill.py", "custom rules")
        assert list_available_skills() == ["custom_skill", "excel_to_python"]


class TestGetSkill:
    def test_user_skill_overrides_package(self, skills_dirs) -> None:
        package_skills_dir, user_dir = skills_dirs
        _write_skill(package_skills_dir / "excel_to_python.py", "package rules")
        _write_skill(user_dir / "excel_to_python.py", "user override")
        assert get_skill("excel_to_python") == "user override"

    def test_returns_none_for_missing_skill(self, skills_dirs) -> None:
        assert get_skill("missing") is None

    def test_rejects_path_traversal(self, skills_dirs) -> None:
        with pytest.raises(ValueError, match="invalid characters"):
            get_skill("../secrets")


class TestReadSkill:
    def test_returns_skill_content(self, skills_dirs) -> None:
        package_skills_dir, _user_dir = skills_dirs
        _write_skill(package_skills_dir / "markdown_rules.py", "# Markdown\nUse headings.")
        result = read_skill("markdown_rules")
        assert result.success
        assert result.tool_name == "read_skill"
        assert "Markdown" in (result.output or "")

    def test_package_excel_to_python_skill(self) -> None:
        assert "excel_to_python" in list_available_skills()
        content = get_skill("excel_to_python")
        assert content is not None
        assert "Configuration cell" in content
        result = read_skill("excel_to_python")
        assert result.success
        assert "mito_check_" in (result.output or "")

    def test_returns_error_for_missing_skill(self, skills_dirs) -> None:
        result = read_skill("does_not_exist")
        assert not result.success
        assert "does_not_exist" in (result.error_message or "")
        assert "Available skills" in (result.error_message or "")

    def test_returns_error_for_invalid_name(self, skills_dirs) -> None:
        result = read_skill("../etc/passwd")
        assert not result.success
        assert result.error_message is not None

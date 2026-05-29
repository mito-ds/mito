# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json

import pytest

from mito_ai_core.completions.prompt_builders.prompt_constants import get_database_rules
from mito_ai_core.skills import database_rules as database_rules_module
from mito_ai_core.skills.types import Skill
from mito_ai_core.skills.utils import SKILLS, get_skill, list_available_skills, read_skill


@pytest.fixture
def db_config(tmp_path, monkeypatch):
    db_dir = tmp_path / "db"
    db_dir.mkdir()
    connections_path = db_dir / "connections.json"
    schemas_path = db_dir / "schemas.json"
    connections_path.write_text(
        json.dumps({"my_db": {"username": "admin", "password": "secret", "host": "localhost"}})
    )
    schemas_path.write_text(json.dumps({"my_db": {"tables": ["users"]}}))
    monkeypatch.setattr(database_rules_module, "CONNECTIONS_PATH", str(connections_path))
    monkeypatch.setattr(database_rules_module, "SCHEMAS_PATH", str(schemas_path))
    return connections_path, schemas_path


class TestSkillRegistry:
    def test_excel_to_python_is_registered(self) -> None:
        assert "excel_to_python" in SKILLS
        assert SKILLS["excel_to_python"].description

    def test_database_rules_is_registered(self) -> None:
        assert "database_rules" in SKILLS

    def test_list_available_skills_includes_excel_to_python(self) -> None:
        assert "excel_to_python" in list_available_skills()

    def test_database_rules_not_listed_without_config(
        self, tmp_path, monkeypatch
    ) -> None:
        missing_path = str(tmp_path / "missing" / "connections.json")
        monkeypatch.setattr(database_rules_module, "CONNECTIONS_PATH", missing_path)
        assert "database_rules" not in list_available_skills()

    def test_database_rules_listed_when_configured(self, db_config) -> None:
        assert "database_rules" in list_available_skills()


class TestGetSkill:
    def test_returns_content_for_registered_skill(self) -> None:
        content = get_skill("excel_to_python")
        assert content is not None
        assert "Configuration cell" in content

    def test_returns_none_for_missing_skill(self) -> None:
        assert get_skill("missing") is None

    def test_database_rules_includes_user_config(self, db_config) -> None:
        content = get_skill("database_rules")
        assert content is not None
        assert "SQLAlchemy" in content
        assert "redacted" in content
        assert "users" in content


class TestReadSkill:
    def test_returns_skill_content(self) -> None:
        result = read_skill("excel_to_python")
        assert result.success
        assert result.tool_name == "read_skill"
        assert "mito_check_" in (result.output or "")

    def test_read_database_rules(self, db_config) -> None:
        result = read_skill("database_rules")
        assert result.success
        assert "Your Database Configuration" in (result.output or "")

    def test_returns_error_for_missing_skill(self) -> None:
        result = read_skill("does_not_exist")
        assert not result.success
        assert "does_not_exist" in (result.error_message or "")
        assert "Available skills" in (result.error_message or "")

    def test_returns_error_for_empty_name(self) -> None:
        result = read_skill("")
        assert not result.success
        assert result.error_message is not None


class TestFormatAvailableSkills:
    def test_includes_name_and_description(self) -> None:
        from mito_ai_core.completions.prompt_builders.skills import format_available_skills

        formatted = format_available_skills()
        assert "excel_to_python:" in formatted
        assert "Convert Excel workbook logic" in formatted

    def test_includes_database_rules_when_configured(self, db_config) -> None:
        from mito_ai_core.completions.prompt_builders.skills import format_available_skills

        formatted = format_available_skills()
        assert "database_rules:" in formatted
        assert "database" in formatted.lower()

    def test_custom_skill_in_registry(self, monkeypatch: pytest.MonkeyPatch) -> None:
        from mito_ai_core.completions.prompt_builders.skills import format_available_skills

        class CustomSkill(Skill):
            name = "custom_skill"
            description = "A test skill."

            def get_content(self) -> str:
                return "custom content"

        custom_skill = CustomSkill()
        monkeypatch.setitem(SKILLS, custom_skill.name, custom_skill)
        assert get_skill("custom_skill") == "custom content"
        assert "custom_skill: A test skill." in format_available_skills()


class TestGetDatabaseRulesForChat:
    def test_returns_empty_when_no_db(self, tmp_path, monkeypatch) -> None:
        missing_path = str(tmp_path / "missing" / "connections.json")
        monkeypatch.setattr(database_rules_module, "CONNECTIONS_PATH", missing_path)
        assert get_database_rules() == ""

    def test_matches_skill_content(self, db_config) -> None:
        from mito_ai_core.skills.database_rules import DatabaseRulesSkill

        skill = DatabaseRulesSkill()
        assert get_database_rules() == skill.get_content()

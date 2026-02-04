# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import requests

RULE_NAME = "test_rule"
RULE_CONTENT = "This is a test rule for data analysis."

from mito_ai.tests.conftest import TOKEN

# --- PUT RULES ---


def test_put_rule_with_auth(jp_base_url):
    response = requests.put(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        headers={"Authorization": f"token {TOKEN}"},
        json={"content": RULE_CONTENT},
    )
    assert response.status_code == 200

    response_json = response.json()
    assert response_json["status"] == "updated"
    assert response_json["rules_file"] == RULE_NAME


def test_put_rule_with_no_auth(jp_base_url):
    response = requests.put(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        json={"content": RULE_CONTENT},
    )

    assert response.status_code == 403  # Forbidden


def test_put_rule_with_incorrect_auth(jp_base_url):
    response = requests.put(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        headers={"Authorization": f"token incorrect-token"}, # <- wrong token
        json={"content": RULE_CONTENT},
    )
    assert response.status_code == 403  # Forbidden


def test_put_rule_missing_content(jp_base_url):
    response = requests.put(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        headers={"Authorization": f"token {TOKEN}"},
        json={},  # Missing content field
    )
    assert response.status_code == 400  # Bad Request


# --- GET SPECIFIC RULE ---


def test_get_rule_with_auth(jp_base_url):
    # First create the rule
    requests.put(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        headers={"Authorization": f"token {TOKEN}"},
        json={"content": RULE_CONTENT},
    )
    # Then get it
    response = requests.get(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200
    response_json = response.json()
    assert response_json["key"] == RULE_NAME
    assert response_json["content"] == RULE_CONTENT
    assert "is_default" in response_json  # is_default field should be present


def test_get_rule_with_no_auth(jp_base_url):
    response = requests.get(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
    )
    assert response.status_code == 403  # Forbidden


def test_get_rule_with_incorrect_auth(jp_base_url):
    response = requests.get(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        headers={"Authorization": f"token incorrect-token"}, # <- wrong token
    )
    assert response.status_code == 403  # Forbidden


def test_get_nonexistent_rule_with_auth(jp_base_url):
    response = requests.get(
        jp_base_url + f"/mito-ai/rules/nonexistent_rule",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 404  # Not Found


# --- GET ALL RULES ---


def test_get_all_rules_with_auth(jp_base_url):
    # First create the rule
    requests.put(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        headers={"Authorization": f"token {TOKEN}"},
        json={"content": RULE_CONTENT},
    )
    # Then get all rules
    response = requests.get(
        jp_base_url + f"/mito-ai/rules",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200
    
    response_json = response.json()
    assert isinstance(response_json, list)
    # Should contain our test rule (with .md extension) as an object with name and is_default
    rule_names = [rule["name"] for rule in response_json]
    assert f"{RULE_NAME}.md" in rule_names
    # Verify structure of rule objects
    test_rule = next((r for r in response_json if r["name"] == f"{RULE_NAME}.md"), None)
    assert test_rule is not None
    assert "is_default" in test_rule


def test_get_all_rules_with_no_auth(jp_base_url):
    response = requests.get(
        jp_base_url + f"/mito-ai/rules",
    )
    assert response.status_code == 403  # Forbidden


def test_get_all_rules_with_incorrect_auth(jp_base_url):
    response = requests.get(
        jp_base_url + f"/mito-ai/rules",
        headers={"Authorization": f"token incorrect-token"},
    )
    assert response.status_code == 403  # Forbidden


# --- DELETE RULES ---


def test_delete_rule_with_auth(jp_base_url):
    # First create the rule
    requests.put(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        headers={"Authorization": f"token {TOKEN}"},
        json={"content": RULE_CONTENT},
    )
    # Verify it exists
    get_response = requests.get(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert get_response.status_code == 200
    
    # Delete it
    delete_response = requests.delete(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert delete_response.status_code == 200
    delete_json = delete_response.json()
    assert delete_json["status"] == "deleted"
    assert delete_json["key"] == RULE_NAME
    
    # Verify it no longer exists
    get_response_after_delete = requests.get(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert get_response_after_delete.status_code == 404


def test_delete_rule_with_no_auth(jp_base_url):
    response = requests.delete(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
    )
    assert response.status_code == 403  # Forbidden


def test_delete_rule_with_incorrect_auth(jp_base_url):
    response = requests.delete(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        headers={"Authorization": f"token incorrect-token"},  # <- wrong token
    )
    assert response.status_code == 403  # Forbidden


def test_delete_nonexistent_rule_with_auth(jp_base_url):
    # Delete a rule that doesn't exist (should succeed - idempotent operation)
    response = requests.delete(
        jp_base_url + f"/mito-ai/rules/nonexistent_rule",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200
    response_json = response.json()
    assert response_json["status"] == "deleted"
    assert response_json["key"] == "nonexistent_rule"


def test_delete_rule_invalid_name(jp_base_url):
    # Try to delete with invalid rule name (contains Windows reserved character ':')
    # This will reach the handler but fail validation in _sanitize_rule_name
    response = requests.delete(
        jp_base_url + f"/mito-ai/rules/rule:with:colons",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 400  # Bad Request
    response_json = response.json()
    assert "error" in response_json

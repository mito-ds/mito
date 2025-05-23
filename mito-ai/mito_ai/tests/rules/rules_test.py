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
    assert response_json["rules file "] == RULE_NAME


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
    response = requests.get(
        jp_base_url + f"/mito-ai/rules/{RULE_NAME}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200
    assert response.json() == {"key": RULE_NAME, "content": RULE_CONTENT}


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
    response = requests.get(
        jp_base_url + f"/mito-ai/rules",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200
    
    response_json = response.json()
    assert isinstance(response_json, list)
    # Should contain our test rule (with .md extension)
    assert f"{RULE_NAME}.md" in response_json


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

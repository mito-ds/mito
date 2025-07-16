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


# --- DELETE RULES ---


def test_delete_rule_with_auth(jp_base_url):
    # First create a rule to delete
    delete_rule_name = "delete_test_rule"
    delete_rule_content = "Content to be deleted"
    
    # Create the rule
    create_response = requests.put(
        jp_base_url + f"/mito-ai/rules/{delete_rule_name}",
        headers={"Authorization": f"token {TOKEN}"},
        json={"content": delete_rule_content},
    )
    assert create_response.status_code == 200
    
    # Verify the rule exists
    get_response = requests.get(
        jp_base_url + f"/mito-ai/rules/{delete_rule_name}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert get_response.status_code == 200
    
    # Delete the rule
    delete_response = requests.delete(
        jp_base_url + f"/mito-ai/rules/{delete_rule_name}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert delete_response.status_code == 200
    
    response_json = delete_response.json()
    assert response_json["status"] == "deleted"
    assert response_json["rule"] == delete_rule_name
    
    # Verify the rule is gone
    get_response_after_delete = requests.get(
        jp_base_url + f"/mito-ai/rules/{delete_rule_name}",
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
        headers={"Authorization": f"token incorrect-token"}, # <- wrong token
    )
    assert response.status_code == 403  # Forbidden


def test_delete_nonexistent_rule_with_auth(jp_base_url):
    response = requests.delete(
        jp_base_url + f"/mito-ai/rules/nonexistent_rule",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 404  # Not Found


def test_delete_rule_without_key(jp_base_url):
    response = requests.delete(
        jp_base_url + f"/mito-ai/rules/",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 403  # Forbidden - URL pattern doesn't match


# --- RENAME RULES ---


def test_rename_rule_with_auth(jp_base_url):
    # First create a rule to rename
    rename_test_rule = "rename_test_rule"
    rename_test_content = "Content to be renamed"
    
    # Create the rule
    create_response = requests.put(
        jp_base_url + f"/mito-ai/rules/{rename_test_rule}",
        headers={"Authorization": f"token {TOKEN}"},
        json={"content": rename_test_content},
    )
    assert create_response.status_code == 200
    
    # Rename the rule
    new_rule_name = "renamed_test_rule"
    new_content = "Updated content after rename"
    
    rename_response = requests.post(
        jp_base_url + f"/mito-ai/rules/rename",
        headers={"Authorization": f"token {TOKEN}", "Content-Type": "application/json"},
        json={
            "old_key": rename_test_rule,
            "new_key": new_rule_name,
            "content": new_content
        }
    )
    assert rename_response.status_code == 200
    
    response_json = rename_response.json()
    assert response_json["status"] == "renamed"
    assert response_json["old_key"] == rename_test_rule
    assert response_json["new_key"] == new_rule_name
    assert response_json["content_updated"] is True
    
    # Verify the old rule is gone
    old_rule_response = requests.get(
        jp_base_url + f"/mito-ai/rules/{rename_test_rule}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert old_rule_response.status_code == 404
    
    # Verify the new rule exists with updated content
    new_rule_response = requests.get(
        jp_base_url + f"/mito-ai/rules/{new_rule_name}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert new_rule_response.status_code == 200
    new_rule_json = new_rule_response.json()
    assert new_rule_json["key"] == new_rule_name
    assert new_rule_json["content"] == new_content


def test_rename_rule_without_content_update(jp_base_url):
    # Create a rule to rename
    rename_no_content_rule = "rename_no_content_rule"
    original_content = "Original content"
    
    # Create the rule
    create_response = requests.put(
        jp_base_url + f"/mito-ai/rules/{rename_no_content_rule}",
        headers={"Authorization": f"token {TOKEN}"},
        json={"content": original_content},
    )
    assert create_response.status_code == 200
    
    # Rename the rule without updating content
    new_rule_name = "renamed_no_content_rule"
    
    rename_response = requests.post(
        jp_base_url + f"/mito-ai/rules/rename",
        headers={"Authorization": f"token {TOKEN}", "Content-Type": "application/json"},
        json={
            "old_key": rename_no_content_rule,
            "new_key": new_rule_name
        }
    )
    assert rename_response.status_code == 200
    
    response_json = rename_response.json()
    assert response_json["status"] == "renamed"
    assert response_json["content_updated"] is False
    
    # Verify the new rule exists with original content
    new_rule_response = requests.get(
        jp_base_url + f"/mito-ai/rules/{new_rule_name}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert new_rule_response.status_code == 200
    new_rule_json = new_rule_response.json()
    assert new_rule_json["content"] == original_content


def test_rename_nonexistent_rule(jp_base_url):
    response = requests.post(
        jp_base_url + f"/mito-ai/rules/rename",
        headers={"Authorization": f"token {TOKEN}", "Content-Type": "application/json"},
        json={
            "old_key": "nonexistent_rule",
            "new_key": "new_rule_name"
        }
    )
    assert response.status_code == 404


def test_rename_to_existing_rule(jp_base_url):
    # Create two rules
    rule1 = "existing_rule_1"
    rule2 = "existing_rule_2"
    
    # Create both rules
    requests.put(
        jp_base_url + f"/mito-ai/rules/{rule1}",
        headers={"Authorization": f"token {TOKEN}"},
        json={"content": "Content 1"},
    )
    requests.put(
        jp_base_url + f"/mito-ai/rules/{rule2}",
        headers={"Authorization": f"token {TOKEN}"},
        json={"content": "Content 2"},
    )
    
    # Try to rename rule1 to rule2 (which already exists)
    response = requests.post(
        jp_base_url + f"/mito-ai/rules/rename",
        headers={"Authorization": f"token {TOKEN}", "Content-Type": "application/json"},
        json={
            "old_key": rule1,
            "new_key": rule2
        }
    )
    assert response.status_code == 409  # Conflict


def test_rename_rule_missing_keys(jp_base_url):
    response = requests.post(
        jp_base_url + f"/mito-ai/rules/rename",
        headers={"Authorization": f"token {TOKEN}", "Content-Type": "application/json"},
        json={}
    )
    assert response.status_code == 400

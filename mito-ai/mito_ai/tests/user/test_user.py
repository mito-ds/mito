# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import json
import os
import requests
import tempfile
from unittest.mock import patch
import pytest
from mito_ai.tests.conftest import TOKEN


@pytest.fixture
def mock_user_json():
    """Fixture that creates a temporary user.json file with test data"""
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create the .mito directory
        mito_dir = os.path.join(temp_dir, ".mito")
        os.makedirs(mito_dir, exist_ok=True)

        # Create a user.json file with test data
        user_json_path = os.path.join(mito_dir, "user.json")
        user_data = {
            "user_email": "test@mail.com",
            "static_user_id": "test_user_123",
        }

        with open(user_json_path, "w") as f:
            json.dump(user_data, f)

        yield user_json_path


# --- GET USER KEY ---


def test_get_user_with_mocked_data_success(
    jp_base_url: str, mock_user_json: str
) -> None:
    """Test successful GET user endpoint with mocked data"""
    with patch("mito_ai.utils.db.USER_JSON_PATH", mock_user_json):
        response = requests.get(
            jp_base_url + f"/mito-ai/user/user_email",
            headers={"Authorization": f"token {TOKEN}"},
        )
        assert response.status_code == 200

        response_json = response.json()
        assert response_json["key"] == "user_email"
        assert response_json["value"] == "test@mail.com"


def test_get_user_with_mocked_data_not_found(
    jp_base_url: str, mock_user_json: str
) -> None:
    """Test GET user endpoint with mocked data for non-existent key"""
    with patch("mito_ai.utils.db.USER_JSON_PATH", mock_user_json):
        response = requests.get(
            jp_base_url + "/mito-ai/user/non_existent_key",
            headers={"Authorization": f"token {TOKEN}"},
        )
        assert response.status_code == 404

        response_json = response.json()
        assert (
            response_json["error"] == "User field with key 'non_existent_key' not found"
        )


def test_get_user_with_no_auth(jp_base_url: str) -> None:
    response = requests.get(
        jp_base_url + f"/mito-ai/user/user_email",
    )
    assert response.status_code == 403  # Forbidden


def test_get_user_with_incorrect_auth(jp_base_url: str) -> None:
    response = requests.get(
        jp_base_url + f"/mito-ai/user/user_email",
        headers={"Authorization": f"token incorrect-token"},
    )
    assert response.status_code == 403  # Forbidden


# --- PUT USER KEY ---


def test_put_user_with_mocked_data_success(
    jp_base_url: str, mock_user_json: str
) -> None:
    """Test successful PUT user endpoint with mocked data"""
    with patch("mito_ai.utils.db.USER_JSON_PATH", mock_user_json):
        response = requests.put(
            jp_base_url + f"/mito-ai/user/user_email",
            headers={"Authorization": f"token {TOKEN}"},
            json={"value": "jdoe@mail.com"},
        )
        assert response.status_code == 200

        response_json = response.json()
        assert response_json["status"] == "success"
        assert response_json["key"] == "user_email"
        assert response_json["value"] == "jdoe@mail.com"


def test_put_user_with_no_auth(jp_base_url: str) -> None:
    response = requests.put(
        jp_base_url + f"/mito-ai/user/user_email",
        json={"value": "jdoe@mail.com"},
    )
    assert response.status_code == 403  # Forbidden


def test_put_user_with_incorrect_auth(jp_base_url: str) -> None:
    response = requests.put(
        jp_base_url + f"/mito-ai/user/user_email",
        headers={"Authorization": f"token incorrect-token"},
        json={"value": "jdoe@mail.com"},
    )
    assert response.status_code == 403  # Forbidden

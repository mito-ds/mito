# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import requests
from mito_ai.tests.db.test_db_constants import SNOWFLAKE
from mito_ai.tests.conftest import TOKEN


# --- ADD CONNECTION ---


def test_add_connection_with_auth(jp_base_url: str) -> None:
    response = requests.post(
        jp_base_url + "/mito-ai/db/connections",
        headers={"Authorization": f"token {TOKEN}"},
        json=SNOWFLAKE,
    )
    assert response.status_code == 200


def test_add_connection_with_no_auth(jp_base_url: str) -> None:
    response = requests.post(
        jp_base_url + "/mito-ai/db/connections",
        json=SNOWFLAKE,
    )
    assert response.status_code == 403  # Forbidden


def test_add_connection_with_incorrect_auth(jp_base_url: str) -> None:
    response = requests.post(
        jp_base_url + "/mito-ai/db/connections",
        headers={"Authorization": f"token incorrect-token"},
        json=SNOWFLAKE,
    )
    assert response.status_code == 403  # Forbidden


# --- GET CONNECTIONS ---


def test_get_connections_with_auth(jp_base_url: str, first_connection_id: str) -> None:
    response = requests.get(
        jp_base_url + "/mito-ai/db/connections",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200
    # Ensure the response has the correct number of connections
    assert len(response.json()) == 1
    # Ensure the response has the correct connection details
    assert response.json()[first_connection_id] == SNOWFLAKE


def test_get_connections_with_no_auth(jp_base_url: str) -> None:
    response = requests.get(jp_base_url + "/mito-ai/db/connections")
    assert response.status_code == 403  # Forbidden


def test_get_connections_with_incorrect_auth(jp_base_url: str) -> None:
    response = requests.get(
        jp_base_url + "/mito-ai/db/connections",
        headers={"Authorization": f"token incorrect-token"},
    )
    assert response.status_code == 403  # Forbidden


# --- DELETE CONNECTION ---


def test_delete_connection_with_no_auth(jp_base_url: str, first_connection_id: str) -> None:
    response = requests.delete(
        jp_base_url + f"/mito-ai/db/connections/{first_connection_id}",
    )
    assert response.status_code == 403  # Forbidden


def test_delete_connection_with_incorrect_auth(
    jp_base_url: str, first_connection_id: str
) -> None:
    response = requests.delete(
        jp_base_url + f"/mito-ai/db/connections/{first_connection_id}",
        headers={"Authorization": f"token incorrect-token"},
    )
    assert response.status_code == 403  # Forbidden


def test_delete_connection_with_auth(
    jp_base_url: str, first_connection_id: str
) -> None:
    response = requests.delete(
        jp_base_url + f"/mito-ai/db/connections/{first_connection_id}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200

    # Ensure the connection was deleted
    response = requests.get(
        jp_base_url + f"/mito-ai/db/connections",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert len(response.json()) == 0

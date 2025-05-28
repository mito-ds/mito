# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import pytest
import requests
from mito_ai.tests.db.test_db_constants import CONNECTION_JSON
from mito_ai.tests.conftest import TOKEN

# --- GET SCHEMAS ---


def test_get_schemas_with_auth(jp_base_url):
    # Add a connection to get a schema
    response = requests.post(
        jp_base_url + f"/mito-ai/db/connections",
        headers={"Authorization": f"token {TOKEN}"},
        json=CONNECTION_JSON,
    )
    assert response.status_code == 200

    # Get the schemas
    response = requests.get(
        jp_base_url + f"/mito-ai/db/schemas",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200
    # Esnure that there is one scema dict in the response
    assert len(response.json()) == 1


def test_ensure_no_application_databases(jp_base_url, first_connection_id):
    # We currently don't support Snowflake application databases.
    # This test ensures that we don't crawl application databases.

    response = requests.get(
        jp_base_url + f"/mito-ai/db/schemas",
        headers={"Authorization": f"token {TOKEN}"},
    )

    crawled_databases = response.json()[first_connection_id]["schema"].keys()
    assert len(crawled_databases) > 0
    assert "SNOWFLAKE" not in crawled_databases


def test_get_schemas_with_no_auth(jp_base_url):
    response = requests.get(
        jp_base_url + f"/mito-ai/db/schemas",
    )
    assert response.status_code == 403  # Forbidden


def test_get_schemas_with_incorrect_auth(jp_base_url):
    response = requests.get(
        jp_base_url + f"/mito-ai/db/schemas",
        headers={"Authorization": f"token incorrect-token"},
    )
    assert response.status_code == 403  # Forbidden


# --- DELETE SCHEMA ---


def test_delete_schema_with_auth(jp_base_url, first_connection_id):
    response = requests.delete(
        jp_base_url + f"/mito-ai/db/schemas/{first_connection_id}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200

    # Ensure the schema was deleted
    response = requests.get(
        jp_base_url + f"/mito-ai/db/schemas",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200
    assert len(response.json()) == 0


def test_delete_schema_with_no_auth(jp_base_url, first_connection_id):
    response = requests.delete(
        jp_base_url + f"/mito-ai/db/schemas/{first_connection_id}",
    )
    assert response.status_code == 403  # Forbidden


def test_delete_schema_with_incorrect_auth(jp_base_url, first_connection_id):
    response = requests.delete(
        jp_base_url + f"/mito-ai/db/schemas/{first_connection_id}",
        headers={"Authorization": f"token incorrect-token"},
    )
    assert response.status_code == 403  # Forbidden

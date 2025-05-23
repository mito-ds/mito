import requests
from mito_ai.tests.db.test_db_constants import TOKEN, CONNECTION_JSON


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

import requests
from mito_ai.tests.settings.test_constants import TOKEN

SETTINGS_KEY = "super_secret_mode"
SETTINGS_VALUE = "yes"


# --- PUT SETTINGS ---


def test_put_settings_with_auth(jp_base_url):
    response = requests.put(
        jp_base_url + f"/mito-ai/settings/{SETTINGS_KEY}",
        headers={"Authorization": f"token {TOKEN}"},
        json={"value": SETTINGS_VALUE},
    )
    assert response.status_code == 200

    response_json = response.json()
    assert response_json["status"] == "updated"
    assert response_json["key"] == SETTINGS_KEY
    assert response_json["value"] == SETTINGS_VALUE


def test_put_settings_with_no_auth(jp_base_url):
    response = requests.put(
        jp_base_url + f"/mito-ai/settings/{SETTINGS_KEY}",
        json={"value": SETTINGS_VALUE},
    )

    assert response.status_code == 403  # Forbidden


def test_put_settings_with_incorrect_auth(jp_base_url):
    response = requests.put(
        jp_base_url + f"/mito-ai/settings/{SETTINGS_KEY}",
        headers={"Authorization": f"token incorrect-token"},
        json={"value": SETTINGS_VALUE},
    )
    assert response.status_code == 403  # Forbidden


# # --- GET SETTINGS ---


def test_get_settings_with_auth(jp_base_url):
    response = requests.get(
        jp_base_url + f"/mito-ai/settings/{SETTINGS_KEY}",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200
    assert response.json() == {"key": SETTINGS_KEY, "value": SETTINGS_VALUE}


def test_get_settings_with_no_auth(jp_base_url):
    response = requests.get(
        jp_base_url + f"/mito-ai/settings/{SETTINGS_KEY}",
    )
    assert response.status_code == 403  # Forbidden


def test_get_settings_with_incorrect_auth(jp_base_url):
    response = requests.get(
        jp_base_url + f"/mito-ai/settings/{SETTINGS_KEY}",
        headers={"Authorization": f"token incorrect-token"},
    )
    assert response.status_code == 403  # Forbidden

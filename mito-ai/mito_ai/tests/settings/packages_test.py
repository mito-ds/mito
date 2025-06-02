import requests
from mito_ai.tests.conftest import TOKEN


def test_get_packages(jp_base_url):
    response = requests.get(
        jp_base_url + "/mito-ai/packages",
        headers={"Authorization": f"token {TOKEN}"},
    )
    assert response.status_code == 200
    assert response.json()["packages"] is not None
    assert "mito-ai" in [package["name"] for package in response.json()["packages"]]

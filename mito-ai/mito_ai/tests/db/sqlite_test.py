# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import os
import requests
from mito_ai.tests.db.test_db_constants import (
    SQLITE_TEST_DB_PATH,
    SQLITE_CONNECTION_DETAILS,
)
from mito_ai.tests.conftest import TOKEN


def test_add_sqlite_connection(jp_base_url: str) -> None:
    # Check for the sqlite database
    assert os.path.exists(SQLITE_TEST_DB_PATH)

    response = requests.post(
        jp_base_url + "/mito-ai/db/connections",
        headers={"Authorization": f"token {TOKEN}"},
        json=SQLITE_CONNECTION_DETAILS,
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

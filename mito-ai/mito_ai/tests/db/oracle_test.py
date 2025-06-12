# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import requests
from mito_ai.tests.db.test_db_constants import ORACLE_CONNECTION_DETAILS
from mito_ai.tests.conftest import TOKEN

# To create a postgres database, run the following command:
# docker-compose -f mito_ai/docker/postgres/compose.yml up
# and then, to delete the database, run the following command:
# docker-compose -f mito_ai/docker/postgres/compose.yml down -v


def test_add_oracle_connection(jp_base_url: str) -> None:
    response = requests.post(
        jp_base_url + "/mito-ai/db/connections",
        headers={"Authorization": f"token {TOKEN}"},
        json=ORACLE_CONNECTION_DETAILS,
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

# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from sqlalchemy import create_engine, text
from mito_ai.db.models import WarehouseDetails

SUPPORTED_DATABASE_KINDS = ["STANDARD", "IMPORTED DATABASE"]


def crawl_snowflake(username: str, password: str, account: str, warehouse: str) -> dict:
    try:
        conn_str = (
            f"snowflake://{username}:{password}@{account}/" f"?warehouse={warehouse}"
        )
        engine = create_engine(conn_str)

        # Step 1: Get databases
        db_query = text("SHOW DATABASES")
        with engine.connect() as connection:
            result = connection.execute(db_query)
            databases = result.mappings().all()

        # Step 2: Filter for 'STANDARD' and 'IMPORTED DATABASE' kinds
        filtered_db_names = [
            row["name"] for row in databases if row["kind"] in SUPPORTED_DATABASE_KINDS
        ]

        # Step 3: Escape and format for SQL IN clause
        db_list_sql = ", ".join(f"'{name}'" for name in filtered_db_names)

        # Step 4: Use filtered databases in schema query
        schema_query = text(
            f"""
            SELECT 
                c.table_catalog AS database_name,
                c.table_schema AS schema_name,
                c.table_name,
                c.column_name,
                c.data_type,
                c.comment
            FROM snowflake.account_usage.columns c
            WHERE c.deleted IS NULL
            AND c.table_catalog IN ({db_list_sql})
        """
        )

        # Step 5: Execute the schema query and process the results
        warehouse_details: WarehouseDetails = {"databases": {}}

        with engine.connect() as connection:
            result = connection.execute(schema_query)
            for row in result.fetchall():
                db = row[0]
                schema = row[1]
                table = row[2]
                column_name = row[3]

                db_dict = warehouse_details["databases"].setdefault(db, {"schemas": {}})
                schema_dict = db_dict["schemas"].setdefault(schema, {"tables": {}})
                columns_list = schema_dict["tables"].setdefault(table, [])
                columns_list.append({"name": column_name, "type": row[4]})

        return {
            "schema": warehouse_details,
            "error": None,
        }
    except Exception as e:
        return {
            "schema": None,
            "error": str(e),
        }

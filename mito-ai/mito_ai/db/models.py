# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import TypedDict, List, Dict


# BASE CRAWLER MODELS


class ColumnInfo(TypedDict):
    name: str
    type: str


class TableSchema(TypedDict):
    tables: Dict[str, List[ColumnInfo]]


# SNOWFLAKE MODELS


class SchemaInfo(TypedDict):
    tables: Dict[str, List[ColumnInfo]]


class DatabaseInfo(TypedDict):
    schemas: Dict[str, SchemaInfo]


class WarehouseDetails(TypedDict):
    databases: Dict[str, DatabaseInfo]

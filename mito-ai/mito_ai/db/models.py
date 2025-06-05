from typing import TypedDict, List, Dict


# BASE CRAWLER MODELS


class ColumnInfo(TypedDict):
    name: str
    type: str


class TableSchema(TypedDict):
    tables: dict[str, List[ColumnInfo]]


# SNOWFLAKE MODELS


class SchemaInfo(TypedDict):
    tables: Dict[str, List[ColumnInfo]]


class DatabaseInfo(TypedDict):
    schemas: Dict[str, SchemaInfo]


class WarehouseDetails(TypedDict):
    databases: Dict[str, DatabaseInfo]

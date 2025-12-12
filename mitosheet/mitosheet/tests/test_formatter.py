#!/usr/bin/env python
# coding: utf-8
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Tests for the formatter module, specifically the format_dataframe_mimetype function.
"""

import json

import pandas as pd

from mitosheet.formatter.viewer import format_dataframe_mimetype


def test_format_dataframe_mimetype_basic():
    """Test basic DataFrame formatting."""
    df = pd.DataFrame({"A": [1, 2, 3], "B": ["foo", "bar", "baz"]})

    result = format_dataframe_mimetype(df)

    assert result is not None
    assert "columns" in result
    assert "data" in result
    assert "totalRows" in result
    assert "indexLevels" in result
    assert "columnLevels" in result

    assert result["totalRows"] == 3
    assert result["indexLevels"] == 1
    assert result["columnLevels"] == 1

    # Check column metadata
    columns = result["columns"]
    assert len(columns) == 3  # index + 2 data columns
    assert columns[0]["name"] == ["index"]
    assert columns[1]["name"] == ["A"]
    assert columns[2]["name"] == ["B"]

    # Check data
    data = json.loads(result["data"])
    assert len(data) == 3
    assert data[0] == [0, 1, "foo"]
    assert data[1] == [1, 2, "bar"]
    assert data[2] == [2, 3, "baz"]


def test_format_dataframe_mimetype_with_named_index():
    """Test DataFrame with named index."""
    df = pd.DataFrame({"A": [1, 2, 3], "B": ["foo", "bar", "baz"]})
    df.index.name = "my_index"

    result = format_dataframe_mimetype(df)

    assert result is not None
    assert result["columns"][0]["name"] == ["my_index"]


def test_format_dataframe_mimetype_with_datetime_index():
    """Test DataFrame with datetime index."""
    dates = pd.date_range("2023-01-01", periods=3, freq="D")
    df = pd.DataFrame({"A": [1, 2, 3], "B": ["foo", "bar", "baz"]}, index=dates)

    result = format_dataframe_mimetype(df)

    assert result is not None
    data = json.loads(result["data"])
    assert len(data) == 3
    # Check that datetime is formatted correctly
    assert data[0][0] == "2023-01-01T00:00:00.000"
    assert data[1][0] == "2023-01-02T00:00:00.000"
    assert data[2][0] == "2023-01-03T00:00:00.000"


def test_format_dataframe_mimetype_with_multiindex():
    """Test DataFrame with MultiIndex."""
    index = pd.MultiIndex.from_tuples(
        [("A", 1), ("A", 2), ("B", 1)], names=["letter", "number"]
    )

    df = pd.DataFrame({"X": [10, 20, 30], "Y": [40, 50, 60]}, index=index)

    result = format_dataframe_mimetype(df)

    assert result is not None
    assert result["indexLevels"] == 2

    # Check column metadata includes both index levels
    columns = result["columns"]
    assert len(columns) == 4  # 2 index levels + 2 data columns
    assert columns[0]["name"] == ["letter"]
    assert columns[1]["name"] == ["number"]
    assert columns[2]["name"] == ["X"]
    assert columns[3]["name"] == ["Y"]

    # Check data
    data = json.loads(result["data"])
    assert len(data) == 3
    assert data[0] == ["A", 1, 10, 40]
    assert data[1] == ["A", 2, 20, 50]
    assert data[2] == ["B", 1, 30, 60]


def test_format_dataframe_mimetype_with_nan_values():
    """Test DataFrame with NaN values."""
    df = pd.DataFrame(
        {"A": [1, None, 3], "B": ["foo", None, "baz"], "C": [1.5, float("nan"), 3.5]}
    )

    result = format_dataframe_mimetype(df)

    assert result is not None
    data = json.loads(result["data"])
    assert len(data) == 3
    # NaN values should be converted to empty strings
    assert data[0] == [0, 1.0, "foo", 1.5]
    assert data[1] == [1, None, None, None]
    assert data[2] == [2, 3.0, "baz", 3.5]


def test_format_dataframe_mimetype_truncation():
    """Test DataFrame truncation when exceeding display.max_rows."""
    # Create a DataFrame with more rows than the default display.max_rows
    df = pd.DataFrame({"A": range(100), "B": [f"val_{i}" for i in range(100)]})

    # Temporarily set display.max_rows to a small value
    original_max_rows = pd.get_option("display.max_rows")
    pd.set_option("display.max_rows", 10)

    try:
        result = format_dataframe_mimetype(df)

        assert result is not None
        assert result["totalRows"] == 100
        assert len(json.loads(result["data"])) < result["totalRows"]

    finally:
        # Restore original setting
        pd.set_option("display.max_rows", original_max_rows)


def test_format_dataframe_mimetype_describe_output():
    """Test that describe() output returns None."""
    df = pd.DataFrame({"A": [1, 2, 3, 4, 5], "B": [10, 20, 30, 40, 50]})
    describe_df = df.describe()

    result = format_dataframe_mimetype(describe_df)

    # Should return None for describe() output
    assert result is None


def test_format_dataframe_mimetype_empty_dataframe():
    """Test empty DataFrame."""
    df = pd.DataFrame()

    result = format_dataframe_mimetype(df)

    assert result is not None
    assert result["totalRows"] == 0
    assert len(json.loads(result["data"])) == 0


def test_format_dataframe_mimetype_single_column():
    """Test DataFrame with single column."""
    df = pd.DataFrame({"A": [1, 2, 3]})

    result = format_dataframe_mimetype(df)

    assert result is not None
    columns = result["columns"]
    assert len(columns) == 2  # index + 1 data column
    assert columns[0]["name"] == ["index"]
    assert columns[1]["name"] == ["A"]

    data = json.loads(result["data"])
    assert len(data) == 3
    assert data[0] == [0, 1]
    assert data[1] == [1, 2]
    assert data[2] == [2, 3]


def test_format_dataframe_mimetype_with_different_dtypes():
    """Test DataFrame with different column dtypes."""
    df = pd.DataFrame(
        {
            "int_col": [1, 2, 3],
            "float_col": [1.1, 2.2, 3.3],
            "str_col": ["a", "b", "c"],
            "bool_col": [True, False, True],
            "datetime_col": pd.date_range("2023-01-01", periods=3),
        }
    )

    result = format_dataframe_mimetype(df)

    assert result is not None
    columns = result["columns"]

    # Check that dtypes are preserved in metadata
    dtype_names = [col["dtype"] for col in columns]
    assert "int64" in dtype_names or "int32" in dtype_names
    assert "float64" in dtype_names or "float32" in dtype_names
    assert "object" in dtype_names  # strings
    assert "bool" in dtype_names
    assert any("datetime64" in dtype for dtype in dtype_names)


def test_format_dataframe_mimetype_with_multiindex_columns():
    """Test DataFrame with MultiIndex columns."""
    # Create a DataFrame with MultiIndex columns
    columns = pd.MultiIndex.from_tuples(
        [("A", "one"), ("A", "two"), ("B", "one"), ("B", "two")],
        names=["level_0", "level_1"],
    )
    df = pd.DataFrame([[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]], columns=columns)

    result = format_dataframe_mimetype(df)

    assert result is not None
    assert result["columnLevels"] == 2

    # Check column metadata
    columns_result = result["columns"]
    assert len(columns_result) == 5  # index + 4 data columns

    # Check that column names are lists representing the multi-index structure
    assert columns_result[0]["name"] == ["index"]  # index column
    assert columns_result[1]["name"] == ["A", "one"]  # first multi-index column
    assert columns_result[2]["name"] == ["A", "two"]
    assert columns_result[3]["name"] == ["B", "one"]
    assert columns_result[4]["name"] == ["B", "two"]

    # Check data
    data = json.loads(result["data"])
    assert len(data) == 3
    assert data[0] == [0, 1, 2, 3, 4]
    assert data[1] == [1, 5, 6, 7, 8]
    assert data[2] == [2, 9, 10, 11, 12]

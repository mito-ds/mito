# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import glob
import json
import os
import pandas as pd
import plotly.express as px
import streamlit as st
from dotenv import load_dotenv
from sqlalchemy import create_engine
from snowflake.sqlalchemy import URL


def load_latest_test_results():
    """Load the most recent test results file."""
    report_files = glob.glob("evals/reports/sql_test_results_*.json")
    if not report_files:
        st.error("No test results found!")
        return None

    latest_file = max(report_files, key=os.path.getctime)
    with open(latest_file, "r") as f:
        return json.load(f)


def calculate_test_statistics(results):
    """Calculate overall test statistics."""
    total_tests = len(results)
    total_checks = sum(len(test["results"]) for test in results)
    passed_checks = sum(
        sum(1 for check in test["results"] if check["passed"]) for test in results
    )

    return {
        "total_tests": total_tests,
        "total_checks": total_checks,
        "passed_checks": passed_checks,
        "pass_rate": (passed_checks / total_checks * 100) if total_checks > 0 else 0,
    }


def create_test_results_df(results):
    """Create a DataFrame with detailed test results."""
    rows = []
    for test in results:
        for check in test["results"]:
            rows.append(
                {
                    "test_name": test["name"],
                    "check_name": check["name"],
                    "schema": test["schema"],
                    "test_type": test["test_type"],
                    "notes": check["notes"],
                    "passed": check["passed"],
                }
            )
    return pd.DataFrame(rows)


def main():
    st.set_page_config(page_title="SQL Test Results Dashboard", layout="wide")
    st.title("SQL Test Results Dashboard")

    # ============================================================================
    # LOAD AND INITIALIZE TEST RESULTS
    # ============================================================================
    results = load_latest_test_results()
    if not results:
        return

    # ============================================================================
    # OVERALL STATISTICS SECTION
    # ============================================================================
    stats = calculate_test_statistics(results)

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Test Cases", stats["total_tests"])
    with col2:
        st.metric("Total Checks", stats["total_checks"])
    with col3:
        st.metric("Passed Checks", stats["passed_checks"])
    with col4:
        st.metric("Pass Rate", f"{stats['pass_rate']:.1f}%")

    # Create DataFrame for detailed analysis
    df = create_test_results_df(results)

    # ============================================================================
    # CHECK TYPE ANALYSIS SECTION
    # ============================================================================
    st.subheader("Test Results by Check Type")
    check_type_results = (
        df.groupby("check_name")["passed"].agg(["count", "sum"]).reset_index()
    )
    check_type_results["pass_rate"] = (
        check_type_results["sum"] / check_type_results["count"] * 100
    ).round(1)

    # Get the order of check types from the first test case
    if results:
        check_type_order = [check["name"] for check in results[0]["results"]]

        # Sort the results according to the defined order
        check_type_results["check_name"] = pd.Categorical(
            check_type_results["check_name"], categories=check_type_order, ordered=True
        )
        check_type_results = check_type_results.sort_values("check_name")

    fig = px.bar(
        check_type_results,
        x="check_name",
        y="pass_rate",
        title="Pass Rate by Check Type",
        labels={"check_name": "Check Type", "pass_rate": "Pass Rate (%)"},
        color="pass_rate",
        color_continuous_scale=["red", "yellow", "green"],
        range_color=[0, 100],
    )
    st.plotly_chart(fig, use_container_width=True)

    # ============================================================================
    # SCHEMA PERFORMANCE ANALYSIS SECTION
    # ============================================================================
    st.subheader("Schema Performance Analysis")

    # Calculate schema statistics
    schema_results = df.groupby("schema")["passed"].agg(["count", "sum"]).reset_index()
    schema_results["failed"] = schema_results["count"] - schema_results["sum"]
    schema_results["pass_rate"] = (
        schema_results["sum"] / schema_results["count"] * 100
    ).round(1)

    # Rename 'sum' to 'passed' for clarity
    schema_results = schema_results.rename(columns={"sum": "passed"})

    # Display pass rate metrics
    cols = st.columns(len(schema_results))
    for idx, (_, row) in enumerate(schema_results.iterrows()):
        with cols[idx]:
            st.metric(
                label=row["schema"],
                value=f"{row['pass_rate']:.1f}%",
                delta=f"{row['passed']}/{row['count']} tests",
                delta_color="off",
            )

    # Create stacked bar chart for raw counts
    schema_fig = px.bar(
        schema_results,
        x="schema",
        y=["passed", "failed"],
        title="Test Results by Schema",
        labels={"schema": "Schema", "value": "Number of Tests", "variable": "Result"},
        color_discrete_map={"passed": "green", "failed": "red"},
        barmode="stack",
    )
    schema_fig.update_layout(
        legend_title="Test Result",
        legend=dict(yanchor="top", y=0.99, xanchor="left", x=0.01),
    )

    st.plotly_chart(schema_fig, use_container_width=True)

    # ============================================================================
    # TEST TYPE ANALYSIS SECTION
    # ============================================================================
    st.subheader("Test Type Performance Analysis")

    # Calculate test type statistics
    test_type_results = (
        df.groupby("test_type")["passed"].agg(["count", "sum"]).reset_index()
    )
    test_type_results["failed"] = test_type_results["count"] - test_type_results["sum"]
    test_type_results["pass_rate"] = (
        test_type_results["sum"] / test_type_results["count"] * 100
    ).round(1)

    # Rename 'sum' to 'passed' for clarity
    test_type_results = test_type_results.rename(columns={"sum": "passed"})
    # Create stacked bar chart for raw counts
    test_type_fig = px.bar(
        test_type_results,
        x="test_type",
        y=["passed", "failed"],
        title="Test Results by Test Type",
        labels={
            "test_type": "Test Type",
            "value": "Number of Tests",
            "variable": "Result",
        },
        color_discrete_map={"passed": "green", "failed": "red"},
        barmode="stack",
    )
    test_type_fig.update_layout(
        legend_title="Test Result",
        legend=dict(yanchor="top", y=0.99, xanchor="left", x=0.01),
    )

    st.plotly_chart(test_type_fig, use_container_width=True)

    # ============================================================================
    # DETAILED TEST RESULTS SECTION
    # ============================================================================
    st.subheader("Detailed Test Results")

    # Add filters
    test_type_filter = st.multiselect(
        "Filter by Test Type",
        options=sorted(df["test_type"].unique()),
        default=sorted(df["test_type"].unique()),
    )

    # Apply filters
    filtered_df = df[df["test_type"].isin(test_type_filter)]

    # Display results table
    filtered_df["passed"] = filtered_df["passed"].map({True: "✅", False: "❌"})
    st.dataframe(
        filtered_df,
        use_container_width=True,
    )

    # ============================================================================
    # SQL COMPARISON SECTION
    # ============================================================================
    st.subheader("SQL Query Comparison")
    selected_test = st.selectbox(
        "Select Test Case to View SQL Comparison",
        options=sorted(df["test_name"].unique()),
    )

    test_data = next((r for r in results if r["name"] == selected_test), None)
    if test_data:
        # Display user input
        st.markdown("**User Input**")
        st.text(
            test_data["user_input"]
            if test_data["user_input"]
            else "No user input provided"
        )

        col1, col2 = st.columns(2)
        with col1:
            st.markdown("**Actual SQL**")
            st.code(
                test_data["actual_sql"]
                if test_data["actual_sql"]
                else "No SQL generated"
            )
        with col2:
            st.markdown("**Expected SQL**")
            st.code(
                test_data["expected_sql"]
                if test_data["expected_sql"]
                else "No SQL expected"
            )

        # Display test checks
        st.markdown("**Test Checks**")
        checks_df = pd.DataFrame(test_data["results"])
        checks_df = checks_df[["name", "passed", "notes"]]
        checks_df = checks_df.rename(
            columns={
                "name": "Check Name",
                "passed": "Passed",
                "notes": "Notes",
            }
        )
        # Convert boolean to string for better display
        checks_df["Passed"] = checks_df["Passed"].map({True: "✅", False: "❌"})
        st.dataframe(checks_df, use_container_width=True)

        st.markdown("**Schema**")
        st.text(test_data["schema"])

        st.markdown("**Test Type**")
        st.text(test_data["test_type"])

    # ============================================================================
    # SQL QUERY EXECUTION SECTION
    # ============================================================================
    st.subheader("Execute SQL Queries")

    # Initialize session state for query results if not exists
    if "query1_result" not in st.session_state:
        st.session_state.query1_result = None
    if "query2_result" not in st.session_state:
        st.session_state.query2_result = None

    # Load environment variables
    load_dotenv()

    # Create Snowflake connection
    try:
        engine = create_engine(
            URL(
                account=os.getenv("SNOWFLAKE_ACCOUNT"),
                user=os.getenv("SNOWFLAKE_USER"),
                password=os.getenv("SNOWFLAKE_PASSWORD"),
                warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
            )
        )

        # Create two columns for queries
        col1, col2 = st.columns(2)

        # First query column
        with col1:
            st.markdown("**Query 1**")
            query1 = st.text_area("Enter your SQL query:", height=150, key="query1")

            if st.button("Execute Query 1", key="btn1"):
                if query1:
                    try:
                        st.session_state.query1_result = pd.read_sql(query1, engine)
                    except Exception as e:
                        st.error(f"Error executing query: {str(e)}")
                else:
                    st.warning("Please enter a SQL query")

            # Display results if they exist
            if st.session_state.query1_result is not None:
                st.dataframe(st.session_state.query1_result, use_container_width=True)

        # Second query column
        with col2:
            st.markdown("**Query 2**")
            query2 = st.text_area("Enter your SQL query:", height=150, key="query2")

            if st.button("Execute Query 2", key="btn2"):
                if query2:
                    try:
                        st.session_state.query2_result = pd.read_sql(query2, engine)
                    except Exception as e:
                        st.error(f"Error executing query: {str(e)}")
                else:
                    st.warning("Please enter a SQL query")

            # Display results if they exist
            if st.session_state.query2_result is not None:
                st.dataframe(st.session_state.query2_result, use_container_width=True)

    except Exception as e:
        st.error(f"Error connecting to database: {str(e)}")


if __name__ == "__main__":
    main()

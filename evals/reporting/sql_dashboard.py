# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import glob
import json
import os
import pandas as pd
import plotly.express as px
import streamlit as st


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
                    "notes": check["notes"],
                    "passed": check["passed"],
                }
            )
    return pd.DataFrame(rows)


def main():
    st.set_page_config(page_title="SQL Test Results Dashboard", layout="wide")
    st.title("SQL Test Results Dashboard")

    # Load test results
    results = load_latest_test_results()
    if not results:
        return

    # Calculate and display overall statistics
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

    # Test Results by Check Type
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

    # Schema Performance Analysis
    st.subheader("Schema Performance Analysis")

    # Calculate schema statistics
    schema_results = df.groupby("schema")["passed"].agg(["count", "sum"]).reset_index()
    schema_results["failed"] = schema_results["count"] - schema_results["sum"]
    schema_results["pass_rate"] = (
        schema_results["sum"] / schema_results["count"] * 100
    ).round(1)

    # Display pass rate metrics
    cols = st.columns(len(schema_results))
    for idx, (_, row) in enumerate(schema_results.iterrows()):
        with cols[idx]:
            st.metric(
                label=row["schema"],
                value=f"{row['pass_rate']:.1f}%",
                delta=f"{row['sum']}/{row['count']} tests",
                delta_color="off",
            )

    # Create stacked bar chart for raw counts
    schema_fig = px.bar(
        schema_results,
        x="schema",
        y=["sum", "failed"],
        title="Test Results by Schema",
        labels={"schema": "Schema", "value": "Number of Tests", "variable": "Result"},
        color_discrete_map={"sum": "green", "failed": "red"},
        barmode="stack",
    )
    schema_fig.update_layout(
        legend_title="Test Result",
        legend=dict(yanchor="top", y=0.99, xanchor="left", x=0.01),
    )

    st.plotly_chart(schema_fig, use_container_width=True)

    # Detailed Test Results
    st.subheader("Detailed Test Results")

    # Add filters
    test_filter = st.multiselect(
        "Filter by Test Name",
        options=sorted(df["test_name"].unique()),
        default=sorted(df["test_name"].unique()),
    )

    check_filter = st.multiselect(
        "Filter by Check Type",
        options=sorted(df["check_name"].unique()),
        default=sorted(df["check_name"].unique()),
    )

    # Apply filters
    filtered_df = df[
        (df["test_name"].isin(test_filter)) & (df["check_name"].isin(check_filter))
    ]

    # Display results table
    st.dataframe(
        filtered_df.style.map(
            lambda x: (
                "background-color: #90EE90"
                if x == True
                else "background-color: #FFB6C1" if x == False else ""
            ),
            subset=["passed"],
        ),
        use_container_width=True,
    )

    # SQL Comparison Section
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


if __name__ == "__main__":
    main()

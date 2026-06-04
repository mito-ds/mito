# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np

st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        .stAppDeployButton {display:none;}
        footer {visibility: hidden;}
        .stMainBlockContainer {padding: 2rem 1rem 2rem 1rem;}
    </style>
""", unsafe_allow_html=True)

st.title("Q1 2026 Customer Retention")
st.markdown("This report answers one question: **What was customer retention in Q1 2026?**")

st.header("Configuration")
st.markdown("Change these values and re-run the notebook to calculate retention for a different quarter or customer scope.")

col1, col2 = st.columns(2)
with col1:
    quarter_start = st.date_input(
        "Quarter start",
        value=pd.Timestamp('2026-01-01').date(),
        help="First month used as the starting customer cohort"
    )
with col2:
    quarter_end = st.date_input(
        "Quarter end",
        value=pd.Timestamp('2026-03-01').date(),
        help="Last month used to determine whether starting customers were retained"
    )

col3, col4 = st.columns(2)
with col3:
    selected_segment = st.selectbox(
        "Segment",
        options=['All', 'Enterprise', 'Mid-Market', 'SMB'],
        index=0,
        help="Customer segment filter"
    )
with col4:
    include_trials = st.checkbox(
        "Include trial customers",
        value=False,
        help="When checked, customers in trial status are counted in the starting and ending cohorts"
    )

st.markdown("## Data and method")
st.markdown("The retention calculation uses monthly subscription status. A customer is counted in the starting cohort if they are active in the quarter-start month. They are counted as retained if that same customer is active again in the quarter-end month.")

subscriptions_file = st.file_uploader("Upload subscriptions.csv", type="csv")
customers_file = st.file_uploader("Upload customers.csv", type="csv")

if subscriptions_file is not None and customers_file is not None:
    subscriptions_df = pd.read_csv(subscriptions_file)
    customers_df = pd.read_csv(customers_file)

    subscriptions_df['month'] = pd.to_datetime(subscriptions_df['month'])
    customers_df['signup_date'] = pd.to_datetime(customers_df['signup_date'])

    source_sample_df = subscriptions_df.merge(
        customers_df[['customer_id', 'company_name', 'segment', 'industry']],
        on='customer_id',
        how='left'
    ).sort_values(['customer_id', 'month'])

    st.subheader("Sample Data")
    st.dataframe(source_sample_df.head(10), use_container_width=True)

    st.markdown("## Retention result")
    st.markdown("The tiles below show the selected quarter's customer retention rate, starting cohort size, number retained, and number not retained.")

    subscriptions_with_customers_df = subscriptions_df.merge(
        customers_df[['customer_id', 'company_name', 'segment', 'industry']],
        on='customer_id',
        how='left'
    )

    quarter_start_dt = pd.to_datetime(quarter_start)
    quarter_end_dt = pd.to_datetime(quarter_end)
    retained_statuses = ['active', 'trial'] if include_trials else ['active']

    scoped_subscriptions_df = subscriptions_with_customers_df.copy()
    if selected_segment != 'All':
        scoped_subscriptions_df = scoped_subscriptions_df[scoped_subscriptions_df['segment'] == selected_segment]

    start_customers = set(scoped_subscriptions_df[
        (scoped_subscriptions_df['month'] == quarter_start_dt) &
        (scoped_subscriptions_df['status'].isin(retained_statuses))
    ]['customer_id'])

    end_customers = set(scoped_subscriptions_df[
        (scoped_subscriptions_df['month'] == quarter_end_dt) &
        (scoped_subscriptions_df['status'].isin(retained_statuses))
    ]['customer_id'])

    retained_customers = start_customers & end_customers
    starting_customers_count = len(start_customers)
    retained_customers_count = len(retained_customers)
    not_retained_customers_count = starting_customers_count - retained_customers_count
    retention_rate = retained_customers_count / starting_customers_count if starting_customers_count else 0

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Customer retention", f"{retention_rate:.1%}")
    with col2:
        st.metric("Starting customers", f"{starting_customers_count:,}")
    with col3:
        st.metric("Retained customers", f"{retained_customers_count:,}")
    with col4:
        st.metric("Not retained", f"{not_retained_customers_count:,}")

    st.caption(f"Scope: {selected_segment} segment; statuses counted as retained: {', '.join(retained_statuses)}; period: {quarter_start_dt.strftime('%b %Y')} to {quarter_end_dt.strftime('%b %Y')}.")

    st.markdown("## Retention by segment")
    st.markdown("The chart below breaks the same retention calculation out by customer segment. This helps show whether the overall Q1 result is broad-based or concentrated in one customer group.")

    segment_rows = []
    for segment in sorted(subscriptions_with_customers_df['segment'].dropna().unique()):
        segment_subscriptions_df = subscriptions_with_customers_df[subscriptions_with_customers_df['segment'] == segment]
        segment_start_customers = set(segment_subscriptions_df[
            (segment_subscriptions_df['month'] == quarter_start_dt) &
            (segment_subscriptions_df['status'].isin(retained_statuses))
        ]['customer_id'])
        segment_end_customers = set(segment_subscriptions_df[
            (segment_subscriptions_df['month'] == quarter_end_dt) &
            (segment_subscriptions_df['status'].isin(retained_statuses))
        ]['customer_id'])
        segment_retained_customers = segment_start_customers & segment_end_customers
        segment_starting_count = len(segment_start_customers)
        segment_retained_count = len(segment_retained_customers)
        segment_retention_rate = segment_retained_count / segment_starting_count if segment_starting_count else 0
        segment_rows.append({
            'segment': segment,
            'starting_customers': segment_starting_count,
            'retained_customers': segment_retained_count,
            'not_retained': segment_starting_count - segment_retained_count,
            'retention_rate': segment_retention_rate,
            'retention_label': f'{segment_retention_rate:.1%}'
        })

    segment_retention_df = pd.DataFrame(segment_rows).sort_values('retention_rate', ascending=False).reset_index(drop=True)

    segments = segment_retention_df['segment']
    ret_rates = segment_retention_df['retention_rate']
    ret_labels = segment_retention_df['retention_label']

    TITLE = "Q1 retention was high across customer segments"
    X_LABEL = ""
    Y_LABEL = "Retention rate"
    BAR_COLORS = ["#0F4A3F", "#1F6B5C", "#7FB8A8"]
    BAR_EDGE_COLOR = "#FAFAF7"
    PLOT_BG_COLOR = "#FAFAF7"
    FIG_BG_COLOR = "#FAFAF7"
    FONT_COLOR = "#1A1A1A"
    ANNOTATION_TEXT = "From: subscriptions.csv and customers.csv"
    ANNOTATION_FONT_COLOR = "#6B6B6B"
    FIGURE_SIZE = (14, 3.8)
    FONT_SIZE_TITLE = 15
    FONT_SIZE_LABEL = 14
    FONT_SIZE_TICK = 12
    FONT_SIZE_ANNOTATION = 12
    Y_MAX = 1.2
    BAR_WIDTH = 0.55
    SHOW_LEGEND = False

    fig, ax = plt.subplots(figsize=FIGURE_SIZE)
    bar_colors = BAR_COLORS * ((len(segments) // len(BAR_COLORS)) + 1)
    bars = ax.bar(
        segments,
        ret_rates,
        color=bar_colors[:len(segments)],
        edgecolor=BAR_EDGE_COLOR,
        width=BAR_WIDTH
    )

    for bar, label in zip(bars, ret_labels):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + 0.025,
            label,
            ha='center',
            va='bottom',
            fontsize=FONT_SIZE_LABEL,
            color=FONT_COLOR
        )

    ax.set_title(TITLE, fontsize=FONT_SIZE_TITLE, color=FONT_COLOR, pad=18)
    ax.set_xlabel(X_LABEL, fontsize=FONT_SIZE_LABEL, color=FONT_COLOR)
    ax.set_ylabel(Y_LABEL, fontsize=FONT_SIZE_LABEL, color=FONT_COLOR)
    ax.set_ylim(0, Y_MAX)
    ax.set_facecolor(PLOT_BG_COLOR)
    fig.patch.set_facecolor(FIG_BG_COLOR)
    ax.tick_params(colors=FONT_COLOR, labelsize=FONT_SIZE_TICK, length=0)

    ax.grid(False)
    ax.yaxis.grid(False, which='both')
    ax.xaxis.grid(False, which='both')

    for gridline in ax.get_ygridlines() + ax.get_xgridlines():
        gridline.set_visible(False)

    for spine in ax.spines.values():
        spine.set_visible(False)

    ax.set_yticks(np.linspace(0, 1, 6))
    ax.set_yticklabels([f"{int(y*100)}%" for y in np.linspace(0, 1, 6)], fontsize=FONT_SIZE_TICK, color=FONT_COLOR)

    if not SHOW_LEGEND and ax.get_legend() is not None:
        ax.get_legend().remove()

    fig.text(
        0,
        -0.16,
        ANNOTATION_TEXT,
        ha='left',
        va='top',
        fontsize=FONT_SIZE_ANNOTATION,
        color=ANNOTATION_FONT_COLOR
    )

    plt.tight_layout(rect=[0, 0.05, 1, 1])
    st.pyplot(fig)

    st.markdown("## Key takeaway")
    st.markdown("The final note below summarizes the selected quarter using the same filters as the tiles and chart above.")

    takeaway_col = st.container()
    with takeaway_col:
        st.markdown(f"""
        <div style="background: #D4E8E0; border: 1px solid #7FB8A8; border-radius: 8px; padding: 16px; font-family: Inter, Arial, sans-serif; color: #1A1A1A;">
          <div style="font-size: 18px; color: #0F4A3F; margin-bottom: 6px;">Q1 2026 customer retention was {retention_rate:.1%}.</div>
          <div style="font-size: 14px; line-height: 1.5; color: #1A1A1A;">
            Of the {starting_customers_count:,} customers active in {quarter_start_dt.strftime('%B %Y')}, {retained_customers_count:,} were still active in {quarter_end_dt.strftime('%B %Y')}. That leaves {not_retained_customers_count:,} customers not retained under the selected definition.
          </div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("## Further data Exploration")
    st.dataframe(source_sample_df, use_container_width=True)
else:
    st.info("Please upload both subscriptions.csv and customers.csv files to proceed.")

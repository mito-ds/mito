import streamlit as st
import pandas as pd
import plotly.graph_objects as go

st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        .stAppDeployButton {display:none;}
        footer {visibility: hidden;}
        .stMainBlockContainer {padding: 2rem 1rem 2rem 1rem;}
    </style>
""", unsafe_allow_html=True)

st.title("Portfolio Allocation vs. IPS Targets — Q1 2026")

st.markdown("""
This report compares the current portfolio allocation to the Investment Policy Statement (IPS) targets as of Q1 2026. It answers three questions:

1. How is the portfolio currently allocated by asset class?
2. Which sleeves are above or below their IPS target weights?
3. Which asset classes are outside their IPS rebalance bands and may need action?

The analysis rolls fund-level positions up to asset-class weights using market value, then compares those weights to the IPS target, minimum, maximum, and rebalance-band rules.
""")

st.header("Configuration")

st.markdown("""
Change these values to adjust the reporting date and rebalance sensitivity. The default view is Q1 2026.
""")

positions_config_df = pd.read_csv('portfolio_positions.csv')
available_as_of_dates = sorted(positions_config_df['as_of_date'].unique())

col1, col2 = st.columns(2)

with col1:
    selected_as_of_date_str = st.selectbox(
        "As-of date",
        options=available_as_of_dates,
        index=available_as_of_dates.index('2026-03-31') if '2026-03-31' in available_as_of_dates else 0,
        help="Portfolio position date used for the allocation comparison."
    )

with col2:
    rebalance_band_multiplier = st.slider(
        "Rebalance band multiplier (x)",
        min_value=0.5,
        max_value=2.0,
        value=1.0,
        step=0.1,
        help="Multiplies each IPS rebalance band. 1.0 uses the IPS bands exactly as written."
    )

positions_raw_df = pd.read_csv('portfolio_positions.csv')
ips_df = pd.read_csv('ips_targets.csv')

positions_raw_df['as_of_date'] = pd.to_datetime(positions_raw_df['as_of_date'])
selected_as_of_date = pd.to_datetime(selected_as_of_date_str)
positions_df = positions_raw_df.loc[
    positions_raw_df['as_of_date'].eq(selected_as_of_date)
].copy()

total_aum = positions_df['market_value_usd'].sum()
current_allocation_df = (
    positions_df.groupby('asset_class', as_index=False)['market_value_usd']
    .sum()
    .assign(current_weight_pct=lambda d: d['market_value_usd'] / total_aum * 100)
    .sort_values('current_weight_pct', ascending=False)
)

ips_adjusted_df = ips_df.copy()
ips_adjusted_df['effective_rebalance_band_pct'] = (
    ips_adjusted_df['rebalance_band_pct'] * rebalance_band_multiplier
)

allocation_vs_ips_df = current_allocation_df.merge(ips_adjusted_df, on='asset_class', how='left')
allocation_vs_ips_df['drift_from_target_pct'] = (
    allocation_vs_ips_df['current_weight_pct'] - allocation_vs_ips_df['target_weight_pct']
)
allocation_vs_ips_df['outside_band'] = (
    (allocation_vs_ips_df['drift_from_target_pct'].abs() > allocation_vs_ips_df['effective_rebalance_band_pct'])
    | (allocation_vs_ips_df['current_weight_pct'] < allocation_vs_ips_df['min_weight_pct'])
    | (allocation_vs_ips_df['current_weight_pct'] > allocation_vs_ips_df['max_weight_pct'])
)
allocation_vs_ips_df['status'] = allocation_vs_ips_df['outside_band'].map({True: 'Review', False: 'In range'})
allocation_vs_ips_df['market_value_usd_millions'] = allocation_vs_ips_df['market_value_usd'] / 1_000_000
allocation_vs_ips_df = allocation_vs_ips_df.sort_values('drift_from_target_pct', ascending=False)

st.header("Executive summary")

st.markdown("""
The tiles below summarize the portfolio's current size, how many asset classes need review, and where the largest allocation drifts sit versus IPS targets.
""")

review_count = int(allocation_vs_ips_df['outside_band'].sum())
largest_overweight_row = allocation_vs_ips_df.loc[allocation_vs_ips_df['drift_from_target_pct'].idxmax()]
largest_underweight_row = allocation_vs_ips_df.loc[allocation_vs_ips_df['drift_from_target_pct'].idxmin()]

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("Total AUM", f"${total_aum / 1_000_000:,.0f}M")

with col2:
    st.metric("Asset classes to review", review_count)

with col3:
    st.metric(
        "Largest overweight",
        largest_overweight_row['asset_class'],
        f"{largest_overweight_row['drift_from_target_pct']:+.1f} pts"
    )

with col4:
    st.metric(
        "Largest underweight",
        largest_underweight_row['asset_class'],
        f"{largest_underweight_row['drift_from_target_pct']:+.1f} pts"
    )

st.subheader("What stands out")

st.markdown("""
The short narrative below calls out the main allocation gaps for the selected reporting date.
""")

review_asset_classes = allocation_vs_ips_df.loc[
    allocation_vs_ips_df['outside_band'], 'asset_class'
].tolist()
review_list_text = ', '.join(review_asset_classes)

narrative_text = f"""
**{review_count} asset classes are outside IPS bands.**

{largest_overweight_row['asset_class']} is the largest overweight at {largest_overweight_row['drift_from_target_pct']:+.1f} percentage points versus target.
{largest_underweight_row['asset_class']} is the largest underweight at {largest_underweight_row['drift_from_target_pct']:+.1f} percentage points versus target.
The asset classes flagged for review are: {review_list_text}.

*From: portfolio_positions.csv and ips_targets.csv*
"""

st.info(narrative_text)

st.header("Allocation by asset class versus IPS target")

st.markdown("""
This chart compares each asset class's current portfolio weight against its IPS target. Bars above the target indicate overweights; bars below the target indicate underweights.
""")

chart_df = allocation_vs_ips_df.sort_values('target_weight_pct', ascending=False)

fig = go.Figure()
fig.add_trace(go.Bar(
    x=chart_df['asset_class'],
    y=chart_df['current_weight_pct'],
    name='Current weight',
    marker_color='#4C1D95',
    hovertemplate='<b>%{x}</b><br>Current weight: %{y:.1f}%<extra></extra>'
))
fig.add_trace(go.Bar(
    x=chart_df['asset_class'],
    y=chart_df['target_weight_pct'],
    name='IPS target',
    marker_color='#A78BFA',
    hovertemplate='<b>%{x}</b><br>IPS target: %{y:.1f}%<extra></extra>'
))

fig.update_layout(
    title='Current allocation versus IPS target by asset class',
    xaxis_title='Asset class',
    yaxis_title='Portfolio weight (%)',
    barmode='group',
    plot_bgcolor='#FFFFFF',
    paper_bgcolor='#FFFFFF',
    font=dict(color='#1A1A24'),
    legend_title_text='',
    margin=dict(l=40, r=20, t=70, b=80),
    annotations=[dict(
        text='From: portfolio_positions.csv and ips_targets.csv',
        xref='paper',
        yref='paper',
        x=0,
        y=-0.28,
        showarrow=False,
        font=dict(size=12, color='#6B6B78'),
        xanchor='left'
    )]
)
fig.update_yaxes(gridcolor='#E0E0E0', zerolinecolor='#E0E0E0')
fig.update_xaxes(showgrid=False)

st.plotly_chart(fig, use_container_width=True)

st.header("Full allocation detail")

st.markdown("""
The table below shows every asset class in the portfolio, including current weight, IPS target, drift, policy range, and review status. This is the complete allocation comparison behind the summary tiles and chart.
""")

full_allocation_table_df = allocation_vs_ips_df[[
    'asset_class',
    'market_value_usd_millions',
    'current_weight_pct',
    'target_weight_pct',
    'drift_from_target_pct',
    'min_weight_pct',
    'max_weight_pct',
    'effective_rebalance_band_pct',
    'status'
]].copy()

full_allocation_table_df = full_allocation_table_df.rename(columns={
    'asset_class': 'Asset class',
    'market_value_usd_millions': 'Market value ($M)',
    'current_weight_pct': 'Current weight (%)',
    'target_weight_pct': 'IPS target (%)',
    'drift_from_target_pct': 'Drift from target (pts)',
    'min_weight_pct': 'IPS min (%)',
    'max_weight_pct': 'IPS max (%)',
    'effective_rebalance_band_pct': 'Effective rebalance band (pts)',
    'status': 'Status'
})

st.dataframe(full_allocation_table_df, use_container_width=True, hide_index=True)

st.header("Asset classes outside IPS bands")

st.markdown("""
The table below shows the asset classes that require review under the IPS rules. A sleeve is flagged when it is outside its rebalance band or breaches the IPS minimum/maximum range.
""")

review_table_df = allocation_vs_ips_df.loc[
    allocation_vs_ips_df['outside_band'],
    [
        'asset_class',
        'market_value_usd_millions',
        'current_weight_pct',
        'target_weight_pct',
        'drift_from_target_pct',
        'min_weight_pct',
        'max_weight_pct',
        'effective_rebalance_band_pct',
        'status'
    ]
].copy()

review_table_df = review_table_df.rename(columns={
    'asset_class': 'Asset class',
    'market_value_usd_millions': 'Market value ($M)',
    'current_weight_pct': 'Current weight (%)',
    'target_weight_pct': 'IPS target (%)',
    'drift_from_target_pct': 'Drift from target (pts)',
    'min_weight_pct': 'IPS min (%)',
    'max_weight_pct': 'IPS max (%)',
    'effective_rebalance_band_pct': 'Effective rebalance band (pts)',
    'status': 'Status'
})

st.dataframe(review_table_df, use_container_width=True, hide_index=True)

st.header("How this was computed")

with st.expander("Methodology and data sources"):
    st.markdown("""
    **Data sources**

    - `portfolio_positions.csv`: fund-level positions, asset class, market value, and as-of date.
    - `ips_targets.csv`: IPS target weight, minimum weight, maximum weight, and rebalance band by asset class.

    **Calculation approach**

    1. Filter positions to the selected as-of date in the Configuration panel.
    2. Roll fund-level positions up to asset-class market value.
    3. Calculate current asset-class weight as asset-class market value divided by total AUM.
    4. Compare current weight to the IPS target weight.
    5. Flag an asset class for review if either condition is true:
       - Absolute drift from target is greater than the effective rebalance band.
       - Current weight is below the IPS minimum or above the IPS maximum.

    **Core formulas**

    - Current weight (%) = Asset class market value / Total AUM × 100
    - Drift from target (pts) = Current weight (%) − IPS target (%)
    - Effective rebalance band (pts) = IPS rebalance band (pts) × Rebalance band multiplier
    - Outside band = |Drift| > Effective rebalance band OR Current weight < IPS min OR Current weight > IPS max
    """)

    
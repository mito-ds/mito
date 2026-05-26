import streamlit as st

st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        .stAppDeployButton {display:none;}
        footer {visibility: hidden;}
        .stMainBlockContainer {padding: 2rem 1rem 2rem 1rem;}
    </style>
""", unsafe_allow_html=True)

import pandas as pd
import numpy as np
import plotly.graph_objects as go

st.title("Lattice Ventures Fund IV concentration review")

st.markdown("""
Committing $50M to Lattice Ventures Fund IV would not add new company exposure in this dataset — all 8 Lattice IV portfolio companies already appear in the existing indirect exposure file. The main question is therefore concentration: how much the commitment deepens existing company exposure, and which co-investor / GP relationships are new versus already represented in the current LP book.

This notebook answers three questions:

1. **Portfolio overlap:** Which Lattice IV companies are already in the portfolio?
2. **Concentration impact:** How does a $50M commitment change exposure by company and overall concentration?
3. **Relationship impact:** Which GP / co-investor relationships are already in the portfolio, and which are new?
""")

st.header("Configuration")

st.markdown("Change the proposed commitment amount below to refresh the concentration and relationship analysis.")

commitment_musd = st.slider(
    "Commitment ($M)",
    min_value=0.0,
    max_value=150.0,
    value=50.0,
    step=5.0,
    help="Proposed LP commitment to Lattice Ventures Fund IV, in millions of dollars."
)

st.header("Data used")

st.markdown("""
The analysis uses four source files:

- `lattice_iv_portfolio.csv`: Lattice IV target portfolio companies, sectors, rounds, and check sizes.
- `lattice_iv_co_investors.csv`: Co-investors associated with each Lattice IV portfolio company.
- `client_indirect_exposure.csv`: Current indirect company exposure through existing fund positions.
- `client_lp_positions.csv`: Current LP fund positions, managers, commitments, and NAV.
""")

lattice_portfolio_df = pd.read_csv('lattice_iv_portfolio.csv')
lattice_co_investors_df = pd.read_csv('lattice_iv_co_investors.csv')
client_indirect_exposure_df = pd.read_csv('client_indirect_exposure.csv')
client_lp_positions_df = pd.read_csv('client_lp_positions.csv')

st.header("Calculation approach")

st.markdown("""
The $50M proposed commitment is allocated across Lattice IV's portfolio companies in proportion to Lattice's planned check sizes. That gives a company-level estimate of incremental exposure, which is then added to the existing indirect exposure already held through current fund positions.

Concentration is shown two ways:

- **Company overlap:** whether Lattice IV adds new portfolio companies or deepens existing ones.
- **Exposure concentration:** existing exposure to Lattice IV companies as a share of current NAV, compared with post-commitment exposure as a share of NAV plus the proposed commitment.
""")

proposed_commitment_musd = commitment_musd

lattice_total_check_musd = lattice_portfolio_df['check_size_musd'].sum()
current_nav_musd = client_lp_positions_df['current_nav_musd'].sum()
post_commitment_nav_musd = current_nav_musd + proposed_commitment_musd

lattice_allocation_df = lattice_portfolio_df.copy()
lattice_allocation_df['lattice_weight'] = lattice_allocation_df['check_size_musd'] / lattice_total_check_musd
lattice_allocation_df['incremental_exposure_musd'] = lattice_allocation_df['lattice_weight'] * proposed_commitment_musd

existing_company_exposure_df = (
    client_indirect_exposure_df
    .groupby('company', as_index=False)['exposure_musd']
    .sum()
    .rename(columns={'exposure_musd': 'existing_exposure_musd'})
)

company_concentration_df = lattice_allocation_df.merge(
    existing_company_exposure_df,
    on='company',
    how='left'
)
company_concentration_df['existing_exposure_musd'] = company_concentration_df['existing_exposure_musd'].fillna(0)
company_concentration_df['post_exposure_musd'] = (
    company_concentration_df['existing_exposure_musd'] + company_concentration_df['incremental_exposure_musd']
)
company_concentration_df['incremental_as_pct_existing'] = np.where(
    company_concentration_df['existing_exposure_musd'] > 0,
    company_concentration_df['incremental_exposure_musd'] / company_concentration_df['existing_exposure_musd'],
    np.nan
)

lattice_company_count = lattice_portfolio_df['company'].nunique()
existing_overlap_count = company_concentration_df.loc[company_concentration_df['existing_exposure_musd'] > 0, 'company'].nunique()
new_company_count = lattice_company_count - existing_overlap_count
existing_lattice_exposure_musd = company_concentration_df['existing_exposure_musd'].sum()
incremental_lattice_exposure_musd = company_concentration_df['incremental_exposure_musd'].sum()
post_lattice_exposure_musd = company_concentration_df['post_exposure_musd'].sum()
pre_lattice_concentration_pct = existing_lattice_exposure_musd / current_nav_musd
post_lattice_concentration_pct = post_lattice_exposure_musd / post_commitment_nav_musd
concentration_change_pct_points = post_lattice_concentration_pct - pre_lattice_concentration_pct

existing_managers = set(client_lp_positions_df['manager'])

co_investor_relationship_df = (
    lattice_co_investors_df
    .groupby('co_investor', as_index=False)
    .agg(
        company_count=('company', 'nunique'),
        companies=('company', lambda values: ', '.join(sorted(values.unique())))
    )
    .sort_values(['company_count', 'co_investor'], ascending=[False, True])
)
co_investor_relationship_df['relationship_status'] = np.where(
    co_investor_relationship_df['co_investor'].isin(existing_managers),
    'Existing LP relationship',
    'New GP relationship'
)

new_gp_relationship_count = (co_investor_relationship_df['relationship_status'] == 'New GP relationship').sum()
existing_gp_relationship_count = (co_investor_relationship_df['relationship_status'] == 'Existing LP relationship').sum()
new_gp_relationships = co_investor_relationship_df.loc[
    co_investor_relationship_df['relationship_status'] == 'New GP relationship',
    'co_investor'
].tolist()
existing_gp_relationships = co_investor_relationship_df.loc[
    co_investor_relationship_df['relationship_status'] == 'Existing LP relationship',
    'co_investor'
].tolist()

st.header("Executive summary")

st.markdown("""
The commitment adds no new portfolio companies based on the current exposure file. It increases exposure to the same 8 Lattice IV companies already held indirectly, moving Lattice-company concentration from the low teens to roughly two-fifths of NAV plus the proposed commitment under the $50M scenario.

The relationship picture is mixed: most named co-investors are already represented in the LP book, but two co-investor relationships appear new.
""")

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric("New portfolio companies", new_company_count)

with col2:
    st.metric("Lattice companies already held", f"{existing_overlap_count}/{lattice_company_count}")

with col3:
    st.metric("Post-commitment concentration", f"{post_lattice_concentration_pct:.1%}")

with col4:
    st.metric("New GP relationships", new_gp_relationship_count)

st.caption("From: lattice_iv_portfolio.csv, client_indirect_exposure.csv, client_lp_positions.csv, lattice_iv_co_investors.csv.")

st.header("Concentration by company, before and after")

st.markdown("""
The largest post-commitment exposure is Anthropic, but the bigger risk signal is breadth: every Lattice IV company is already in the current indirect exposure file. The chart below separates existing exposure from the incremental exposure created by the proposed commitment.
""")

company_chart_df = company_concentration_df.sort_values('post_exposure_musd', ascending=True).copy()

fig = go.Figure()
fig.add_trace(go.Bar(
    y=company_chart_df['company'],
    x=company_chart_df['existing_exposure_musd'],
    name='Existing exposure',
    orientation='h',
    marker_color='#7FB8A8',
    hovertemplate='<b>%{y}</b><br>Existing exposure: $%{x:.2f}M<extra></extra>'
))
fig.add_trace(go.Bar(
    y=company_chart_df['company'],
    x=company_chart_df['incremental_exposure_musd'],
    name='Incremental from Lattice IV',
    orientation='h',
    marker_color='#0F4A3F',
    hovertemplate='<b>%{y}</b><br>Incremental exposure: $%{x:.2f}M<extra></extra>'
))

fig.update_layout(
    title='Company exposure increases are concentrated in existing names',
    xaxis_title='Exposure ($M)',
    yaxis_title='',
    barmode='stack',
    plot_bgcolor='#FAFAF7',
    paper_bgcolor='#FAFAF7',
    font=dict(color='#1A1A1A', family='Inter, Arial, sans-serif'),
    legend=dict(orientation='h', yanchor='bottom', y=1.02, xanchor='left', x=0),
    margin=dict(l=20, r=20, t=80, b=50),
    height=440
)
fig.update_xaxes(gridcolor='#E8E8E5', zerolinecolor='#E8E8E5')
fig.update_yaxes(showgrid=False)

st.plotly_chart(fig, use_container_width=True)

st.header("Overall concentration impact")

st.markdown("""
The proposed commitment raises exposure to Lattice IV companies because the new allocation stacks on top of existing indirect positions. The table below summarizes the before-and-after concentration view for the selected commitment amount.
""")

concentration_summary_df = pd.DataFrame({
    'Metric': [
        'Current NAV',
        'Proposed Lattice IV commitment',
        'Existing exposure to Lattice IV companies',
        'Incremental exposure from Lattice IV',
        'Post-commitment exposure to Lattice IV companies',
        'Pre-commitment Lattice-company concentration',
        'Post-commitment Lattice-company concentration',
        'Change in concentration'
    ],
    'Value': [
        f'${current_nav_musd:,.1f}M',
        f'${proposed_commitment_musd:,.1f}M',
        f'${existing_lattice_exposure_musd:,.1f}M',
        f'${incremental_lattice_exposure_musd:,.1f}M',
        f'${post_lattice_exposure_musd:,.1f}M',
        f'{pre_lattice_concentration_pct:.1%}',
        f'{post_lattice_concentration_pct:.1%}',
        f'+{concentration_change_pct_points:.1%} pts'
    ]
})

st.dataframe(concentration_summary_df, use_container_width=True, hide_index=True)

st.header("Company-level exposure detail")

st.markdown("""
This table shows the same concentration impact at the company level. The companies with the highest post-commitment exposure are the places where the proposed commitment most deepens existing concentration.
""")

company_detail_df = (
    company_concentration_df
    .sort_values('post_exposure_musd', ascending=False)
    .assign(
        **{
            'Existing exposure ($M)': lambda df: df['existing_exposure_musd'].round(2),
            'Incremental exposure ($M)': lambda df: df['incremental_exposure_musd'].round(2),
            'Post exposure ($M)': lambda df: df['post_exposure_musd'].round(2),
            'Incremental vs existing': lambda df: df['incremental_as_pct_existing'].map(lambda value: f'{value:.1%}' if pd.notna(value) else 'New')
        }
    )
    [
        [
            'company',
            'sector',
            'round',
            'Existing exposure ($M)',
            'Incremental exposure ($M)',
            'Post exposure ($M)',
            'Incremental vs existing'
        ]
    ]
    .rename(columns={
        'company': 'Company',
        'sector': 'Sector',
        'round': 'Round'
    })
)

st.dataframe(company_detail_df, use_container_width=True, hide_index=True)

st.header("GP relationship impact")

st.markdown("""
Lattice IV introduces two co-investor relationships that are not already represented as managers in the current LP positions. The rest of the named co-investor set overlaps with existing GP relationships, so the relationship risk is narrower than the company concentration risk.
""")

relationship_detail_df = (
    co_investor_relationship_df
    .rename(columns={
        'co_investor': 'GP / co-investor',
        'company_count': 'Lattice IV company count',
        'companies': 'Associated Lattice IV companies',
        'relationship_status': 'Relationship status'
    })
    [
        [
            'GP / co-investor',
            'Relationship status',
            'Lattice IV company count',
            'Associated Lattice IV companies'
        ]
    ]
)

st.dataframe(relationship_detail_df, use_container_width=True, hide_index=True)

st.header("Bottom line")

st.markdown(f"""
A ${proposed_commitment_musd:.0f}M commitment to Lattice IV is a concentration trade, not a diversification trade. It adds **0 new companies**, deepens exposure to **8 existing companies**, and introduces **2 new GP / co-investor relationships**: Amplify Partners and Redpoint Ventures.

---

### How this was computed

**Source files used**

- `lattice_iv_portfolio.csv`
- `lattice_iv_co_investors.csv`
- `client_indirect_exposure.csv`
- `client_lp_positions.csv`

**Method**

1. The proposed commitment was allocated across Lattice IV companies in proportion to each company's planned Lattice check size.
2. Existing company exposure was summed across all current indirect fund exposures.
3. Post-commitment exposure was calculated as existing exposure plus the allocated Lattice IV exposure.
4. Concentration was calculated as exposure to Lattice IV companies divided by current NAV before the commitment, and by current NAV plus the proposed commitment after the commitment.
5. GP / co-investor relationships were marked as existing when the co-investor appeared as a manager in current LP positions; otherwise, they were marked as new.
""")

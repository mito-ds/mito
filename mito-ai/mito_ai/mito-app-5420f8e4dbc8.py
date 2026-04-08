import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import streamlit as st

st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        .stAppDeployButton {display:none;}
        footer {visibility: hidden;}
        .stMainBlockContainer {padding: 2rem 1rem 2rem 1rem;}
    </style>
""", unsafe_allow_html=True)

st.title("NYC Car Crashes Analysis")
st.markdown("Analysis of pedestrian and cyclist fatalities by vehicle type")

# Load data
url = 'https://raw.githubusercontent.com/mito-ds/mito/refs/heads/dev/jupyterhub/nyc_car_crashes.csv'
crashes_df = pd.read_csv(url)

st.subheader("Dataset Overview")
col1, col2 = st.columns(2)
with col1:
    st.metric("Dataset Shape", f"{crashes_df.shape[0]} rows × {crashes_df.shape[1]} columns")
with col2:
    st.metric("Columns", len(crashes_df.columns))

st.markdown("**Column names:**")
st.write(crashes_df.columns.tolist())

st.markdown("**First few rows:**")
st.dataframe(crashes_df.head(), use_container_width=True)

# Data processing
crashes_clean = crashes_df[crashes_df['vehicle_type_code_1'].notna()].copy()

# Calculate total pedestrian and cyclist fatalities per vehicle type
vehicle_fatalities = crashes_clean.groupby('vehicle_type_code_1').agg({
    'killed_pedestrians': 'sum',
    'killed_cyclist': 'sum',
    'collision_id': 'count'
}).reset_index()

vehicle_fatalities.columns = ['vehicle_type', 'pedestrian_fatalities', 'cyclist_fatalities', 'collision_count']

# Calculate total fatalities and fatality rate
vehicle_fatalities['total_fatalities'] = vehicle_fatalities['pedestrian_fatalities'] + vehicle_fatalities['cyclist_fatalities']
vehicle_fatalities['fatality_rate_per_collision'] = vehicle_fatalities['total_fatalities'] / vehicle_fatalities['collision_count']

# Sort by total fatalities descending
vehicle_fatalities = vehicle_fatalities.sort_values('total_fatalities', ascending=False)

st.subheader("Fatalities by Vehicle Type")
st.dataframe(vehicle_fatalities.head(15), use_container_width=True)

# Visualization
st.subheader("Fatality Analysis")

# Filter to top 12 vehicle types by total fatalities for clarity
top_vehicles = vehicle_fatalities.head(12).copy()

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6))

# Plot 1: Total Fatalities
ax1.barh(top_vehicles['vehicle_type'], top_vehicles['total_fatalities'], color='#e74c3c', alpha=0.8)
ax1.set_xlabel('Total Fatalities (Pedestrians + Cyclists)', fontsize=11)
ax1.set_title('Total Pedestrian & Cyclist Fatalities by Vehicle Type', fontsize=14, fontweight='bold')
ax1.tick_params(axis='both', labelsize=10)
ax1.invert_yaxis()
for i, v in enumerate(top_vehicles['total_fatalities']):
    ax1.text(v + 0.1, i, str(int(v)), va='center', fontsize=10)

# Plot 2: Fatality Rate per Collision
ax2.barh(top_vehicles['vehicle_type'], top_vehicles['fatality_rate_per_collision'] * 100, color='#3498db', alpha=0.8)
ax2.set_xlabel('Fatality Rate (% per collision)', fontsize=11)
ax2.set_title('Fatality Rate per Collision by Vehicle Type', fontsize=14, fontweight='bold')
ax2.tick_params(axis='both', labelsize=10)
ax2.invert_yaxis()
for i, v in enumerate(top_vehicles['fatality_rate_per_collision'] * 100):
    ax2.text(v + 0.01, i, f'{v:.2f}%', va='center', fontsize=10)

plt.tight_layout()
st.pyplot(fig)

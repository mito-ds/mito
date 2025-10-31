import streamlit as st
import pandas as pd
import folium
from folium.plugins import HeatMap
import streamlit.components.v1 as components
import altair as alt
from calendar import month_abbr

st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        .stAppDeployButton {display:none;}
        footer {visibility: hidden;}
        .stMainBlockContainer {padding: 2rem 1rem 2rem 1rem;}
    </style>
""", unsafe_allow_html=True)

st.title('Brighton SLSC - Location Analysis Dashboard')

# Load the TSV file
@st.cache_data
def load_data():
    df = pd.read_csv('4292134_Brighton_SLSC_pin_report.tsv', sep='\t')
    df['Date'] = pd.to_datetime(df['Date'])
    df['Month'] = df['Date'].dt.to_period('M')
    df['Hour'] = pd.to_datetime(df['Time of Day'], format='%H:%M:%S').dt.hour
    df['Season'] = df['Month'].apply(lambda x: 'Summer' if x.month in [12, 1, 2] else 'Winter' if x.month in [6, 7, 8] else 'Spring/Autumn')
    return df

df = load_data()









# Count unique devices that visited this location
st.header('Unique Visitor Analysis')
unique_devices = df['Hashed Device ID'].nunique()

col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Unique Devices", f"{unique_devices:,}")
with col2:
    st.metric("Total Visits", f"{len(df):,}")
with col3:
    date_range_days = (df['Date'].max() - df['Date'].min()).days
    st.metric("Date Range (days)", f"{date_range_days}")

# Aggregate visits by month
st.header('Monthly Visit Analysis')
monthly_visits = df.groupby('Month').size().reset_index(name='Total_Visits')
st.subheader('Visits by month')
st.dataframe(monthly_visits)

# Calculate percentages
total_visits = monthly_visits['Total_Visits'].sum()
monthly_visits['Percentage'] = (monthly_visits['Total_Visits'] / total_visits) * 100

# Create a bar graph of visits by month as percentages
st.subheader('Brighton SLSC - Visits by Month (%)')

# Prepare data for plotting
from calendar import month_abbr
plot_months = monthly_visits.copy()
plot_months['Month_Abbr'] = plot_months['Month'].apply(lambda x: month_abbr[int(str(x).split('-')[1])] + ' ' + str(x).split('-')[0])

# Sort by the actual date to ensure chronological order
plot_months['Month_Sort'] = plot_months['Month'].apply(lambda x: pd.Period(str(x)))
plot_months = plot_months.sort_values('Month_Sort')

# Create a list of month abbreviations in chronological order for the chart
month_order = plot_months['Month_Abbr'].tolist()

hover = alt.selection_point(on='mouseover', fields=['Month_Abbr'], empty=False)

month_chart = alt.Chart(plot_months).mark_bar(
    strokeWidth=2
).encode(
    x=alt.X('Month_Abbr:N', title='Month', axis=alt.Axis(labelAngle=-45), sort=month_order),
    y=alt.Y('Percentage:Q', title='Percentage of Total Visits (%)', axis=alt.Axis(grid=True, gridOpacity=0.3)),
    color=alt.condition(hover, alt.value('red'), alt.value('#4A90E2')),
    stroke=alt.value('#4A90E2'),
    tooltip=[
        alt.Tooltip('Month_Abbr:N', title='Month'),
        alt.Tooltip('Percentage:Q', title='Percentage (%)', format='.2f'),
        alt.Tooltip('Total_Visits:Q', title='Total Visits')
    ]
).properties(
    title='Brighton SLSC - Visits by Month (%)',
    width=800,
    height=500
).add_params(
    hover
).configure_title(
    fontSize=18,
    font='Arial',
    color='black'
).configure_axis(
    labelFontSize=12,
    titleFontSize=12
)

st.altair_chart(month_chart, use_container_width=True)

# Geographic Distribution Map
st.divider()
st.header('Geographic Distribution - Interactive Map')

# Calculate the center point from the data
center_lat = df['Lat of Visit'].mean()
center_lon = df['Lon of Visit'].mean()

# Create the base map
m = folium.Map(
    location=[center_lat, center_lon],
    zoom_start=16,
    tiles='CartoDB positron'
)

# Import h3 for hexagon visualization
try:
    import h3
    from collections import Counter
    
    # Convert lat/lon to H3 hexagons at resolution 15 (even finer grid for maximum detail)
    h3_hexagons = []
    for idx, row in df.iterrows():
        hex_id = h3.latlng_to_cell(row['Lat of Visit'], row['Lon of Visit'], 15)
        h3_hexagons.append(hex_id)
    
    # Count visits per hexagon
    hex_counts = Counter(h3_hexagons)
    
    # Create GeoJSON for choropleth
    features = []
    for hex_id, count in hex_counts.items():
        hex_boundary = h3.cell_to_boundary(hex_id)
        coordinates = [[list(reversed(coord)) for coord in hex_boundary]]
        
        feature = {
            'type': 'Feature',
            'geometry': {
                'type': 'Polygon',
                'coordinates': coordinates
            },
            'properties': {
                'hex_id': hex_id,
                'visit_count': count
            }
        }
        features.append(feature)
    
    geojson_data = {
        'type': 'FeatureCollection',
        'features': features
    }
    
    # Create feature group for hexagon layer
    hexagon_layer = folium.FeatureGroup(name='Hexagon Choropleth', show=True)
    
    # Add GeoJson with styling to the feature group
    folium.GeoJson(
        geojson_data,
        style_function=lambda feature: {
            'fillColor': '#ff0000' if feature['properties']['visit_count'] > 200 else
                         '#ff4500' if feature['properties']['visit_count'] > 100 else
                         '#ffa500' if feature['properties']['visit_count'] > 50 else
                         '#ffff00',
            'fillOpacity': 0.7,
            'color': 'black',
            'weight': 0.5
        },
        tooltip=folium.GeoJsonTooltip(fields=['visit_count'], aliases=['Visits:'])
    ).add_to(hexagon_layer)
    
    # Add hexagon layer to map
    hexagon_layer.add_to(m)
    
except ImportError:
    st.warning("h3 library not available. Showing heatmap only.")

# Create feature group for heatmap layer
heatmap_layer = folium.FeatureGroup(name='Heatmap', show=False)

# Prepare data for heatmap (lat, lon pairs)
heat_data = [[row['Lat of Visit'], row['Lon of Visit']] for idx, row in df.iterrows()]

# Add heatmap to the feature group
HeatMap(
    heat_data,
    min_opacity=0.2,
    max_zoom=18,
    radius=15,
    blur=10,
    gradient={0.4: 'blue', 0.65: 'lime', 0.8: 'orange', 1.0: 'red'}
).add_to(heatmap_layer)

# Add heatmap layer to map
heatmap_layer.add_to(m)

# Create feature group for ring buffers
ring_buffers_layer = folium.FeatureGroup(name='Distance Rings (100m, 500m, 1km)', show=False)

# Add 100m ring buffer
folium.Circle(
    location=[center_lat, center_lon],
    radius=100,
    color='blue',
    fill=False,
    weight=2,
    dash_array='5, 5',
    popup='100m radius',
    tooltip='100m from Brighton SLSC'
).add_to(ring_buffers_layer)

# Add 500m ring buffer
folium.Circle(
    location=[center_lat, center_lon],
    radius=500,
    color='green',
    fill=False,
    weight=2,
    dash_array='5, 5',
    popup='500m radius',
    tooltip='500m from Brighton SLSC'
).add_to(ring_buffers_layer)

# Add 1km ring buffer
folium.Circle(
    location=[center_lat, center_lon],
    radius=1000,
    color='red',
    fill=False,
    weight=2,
    dash_array='5, 5',
    popup='1km radius',
    tooltip='1km from Brighton SLSC'
).add_to(ring_buffers_layer)

# Add ring buffers layer to map
ring_buffers_layer.add_to(m)

# Add a marker for the general Brighton SLSC location
folium.Marker(
    [center_lat, center_lon],
    popup='Brighton SLSC Center',
    tooltip='Brighton SLSC',
    icon=folium.Icon(color='blue', icon='info-sign')
).add_to(m)

# Create custom legend HTML
legend_html = '''
<div style="position: fixed; 
            top: 180px; right: 10px; width: 180px; height: 160px; 
            background-color: white; border:2px solid grey; z-index:9999; 
            font-size:14px; padding: 10px; border-radius: 5px;
            box-shadow: 2px 2px 6px rgba(0,0,0,0.3);">
    <p style="margin: 0 0 10px 0; font-weight: bold; text-align: center;">Visit Density</p>
    <p style="margin: 5px 0;"><span style="background-color: #ff0000; width: 20px; height: 15px; display: inline-block; border: 1px solid black;"></span> 200+ visits</p>
    <p style="margin: 5px 0;"><span style="background-color: #ff4500; width: 20px; height: 15px; display: inline-block; border: 1px solid black;"></span> 101-200 visits</p>
    <p style="margin: 5px 0;"><span style="background-color: #ffa500; width: 20px; height: 15px; display: inline-block; border: 1px solid black;"></span> 51-100 visits</p>
    <p style="margin: 5px 0;"><span style="background-color: #ffff00; width: 20px; height: 15px; display: inline-block; border: 1px solid black;"></span> 1-50 visits</p>
</div>
'''

# Add legend to map
m.get_root().html.add_child(folium.Element(legend_html))

# Add layer control to toggle between hexagon and heatmap views
folium.LayerControl(collapsed=False).add_to(m)

try:
    st.write(f"Created map with {len(hex_counts)} hexagons, heatmap layer, and distance ring buffers")
    st.write(f"Visit counts range from {min(hex_counts.values())} to {max(hex_counts.values())} per hexagon")
except:
    st.write("Map created with heatmap layer and distance ring buffers")

# Display the map
components.html(m._repr_html_(), width=800, height=600)

st.markdown("<hr style='margin-top: 0.5rem; margin-bottom: 0.5rem;'>", unsafe_allow_html=True)
st.header('Hourly Visit Analysis')
hourly_visits = df.groupby('Hour').size().reset_index(name='Total_Visits')

# Calculate percentages
total_hourly_visits = hourly_visits['Total_Visits'].sum()
hourly_visits['Percentage'] = (hourly_visits['Total_Visits'] / total_hourly_visits) * 100

# Create hourly visits by season
st.subheader('Interactive Hourly Visits by Season')
date_range_days_analysis = (df['Date'].max() - df['Date'].min()).days
st.write(f"**Date range:** {df['Date'].min().date()} to {df['Date'].max().date()} | **Date Range (days):** {date_range_days_analysis}")

# Add season filter above the chart
season_filter = st.selectbox(
    'Season:',
    options=['All', 'Summer', 'Winter', 'Spring/Autumn'],
    index=0,
    key='season_selector'
)

hourly_visits_season = df.groupby(['Hour', 'Season']).size().reset_index(name='Total_Visits')

# Calculate percentages within each season
season_totals = hourly_visits_season.groupby('Season')['Total_Visits'].transform('sum')
hourly_visits_season['Percentage'] = (hourly_visits_season['Total_Visits'] / season_totals) * 100

# Prepare data with 'All' option
hourly_visits_all = hourly_visits.copy()
hourly_visits_all['Season'] = 'All'
combined_data = pd.concat([hourly_visits_all, hourly_visits_season])

# Filter data based on selection
filtered_data = combined_data[combined_data['Season'] == season_filter]

# Convert hour to AM/PM format
def hour_to_ampm(hour):
    if hour == 0:
        return '12 AM'
    elif hour < 12:
        return f'{hour} AM'
    elif hour == 12:
        return '12 PM'
    else:
        return f'{hour - 12} PM'

filtered_data['Hour_AMPM'] = filtered_data['Hour'].apply(hour_to_ampm)

# Create hover selection
hover = alt.selection_point(
    fields=['Hour_AMPM'],
    on='mouseover',
    nearest=True,
    empty=False
)

# Create an interactive horizontal bar chart with Altair
chart = alt.Chart(filtered_data).mark_bar(
    stroke='#4A90E2',
    strokeWidth=2
).encode(
    x=alt.X('Percentage:Q', 
            title='Percentage of Total Visits (%)',
            axis=alt.Axis(grid=True, gridOpacity=0.3)),
    y=alt.Y('Hour_AMPM:N', 
            title='Hour of Day',
            sort=[hour_to_ampm(h) for h in range(0, 24)],
            axis=alt.Axis(labelAngle=0)),
    color=alt.condition(
        hover,
        alt.value('#FF6B35'),  # Highlighted color on hover
        alt.value('#4A90E2')   # Default color
    ),
    opacity=alt.condition(
        hover,
        alt.value(1.0),        # Full opacity on hover
        alt.value(0.8)         # Slightly transparent by default
    ),
    tooltip=[
        alt.Tooltip('Hour_AMPM:N', title='Hour'),
        alt.Tooltip('Percentage:Q', title='Percentage (%)', format='.2f'),
        alt.Tooltip('Season:N', title='Season')
    ]
).add_params(
    hover
).properties(
    title='Brighton SLSC - Aggregated Visitation by Hour of Day (%)',
    width=800,
    height=600
).configure_title(
    fontSize=18,
    font='Arial',
    color='black'
).configure_axis(
    labelFontSize=12,
    titleFontSize=12
)

# Use a container with custom CSS for slide animation
st.markdown("""
    <style>
    @keyframes slideIn {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    .chart-container {
        animation: slideIn 0.5s ease-out;
    }
    </style>
""", unsafe_allow_html=True)

# Wrap chart in a container div with animation class
chart_container = st.container()
with chart_container:
    st.markdown(f'<div class="chart-container" key="{season_filter}">', unsafe_allow_html=True)
    st.altair_chart(chart, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

st.subheader('Visits by hour of day')

# Create a copy of hourly_visits for display with subtotals and totals
hourly_visits_display = hourly_visits.copy()

# Add a subtotal row (sum of all visits)
subtotal_row = pd.DataFrame({
    'Hour': ['SUBTOTAL'],
    'Total_Visits': [hourly_visits_display['Total_Visits'].sum()],
    'Percentage': [hourly_visits_display['Percentage'].sum()]
})

# Add a total row (same as subtotal in this case)
total_row = pd.DataFrame({
    'Hour': ['TOTAL'],
    'Total_Visits': [hourly_visits_display['Total_Visits'].sum()],
    'Percentage': [hourly_visits_display['Percentage'].sum()]
})

# Concatenate the original data with subtotal and total rows
hourly_visits_display = pd.concat([hourly_visits_display, subtotal_row, total_row], ignore_index=True)

st.dataframe(hourly_visits_display)



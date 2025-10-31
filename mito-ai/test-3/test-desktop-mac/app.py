import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import numpy as np

st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        .stAppDeployButton {display:none;}
        footer {visibility: hidden;}
        .stMainBlockContainer {padding: 2rem 1rem 2rem 1rem;}
    </style>
""", unsafe_allow_html=True)

st.title('Meta Analysis!!!!')

# Configuration Settings
st.header('Configuration Settings')
st.markdown('Set the date range for analysis and select which acquisitions to include.')

col1, col2 = st.columns(2)
with col1:
    start_date = st.date_input('Start Date', value=pd.to_datetime('2012-01-01'))
with col2:
    end_date = st.date_input('End Date', value=pd.to_datetime('2024-12-31'))

st.subheader('Select Acquisitions to Include')
col1, col2, col3 = st.columns(3)
with col1:
    include_instagram = st.checkbox('Instagram', value=True)
with col2:
    include_whatsapp = st.checkbox('WhatsApp', value=True)
with col3:
    include_giphy = st.checkbox('Giphy', value=True)

start_date = start_date.strftime('%Y-%m-%d')
end_date = end_date.strftime('%Y-%m-%d')

# Load Meta stock price data
meta_df = pd.read_csv('https://raw.githubusercontent.com/mito-ds/mito/refs/heads/dev/jupyterhub/meta_stock_prices.csv')
meta_df['date'] = pd.to_datetime(meta_df['date'])

# Filter data based on configured date range
meta_df = meta_df[(meta_df['date'] >= start_date) & (meta_df['date'] <= end_date)]

# Stock Price Visualization
st.header('Meta Stock Price History')

# Set style for a more professional look
plt.style.use('seaborn-v0_8-darkgrid')

# Create figure and axis with better proportions
fig, ax1 = plt.subplots(figsize=(16, 8))

# Plot the closing price with a more professional color
ax1.plot(meta_df['date'], meta_df['close'], linewidth=2.5, color='#1c4587', label='Meta Stock Price', alpha=0.9)
ax1.set_xlabel('Year', fontsize=14, fontweight='bold', color='#333333')
ax1.set_ylabel('Stock Price (USD)', fontsize=14, fontweight='bold', color='#1c4587')
ax1.tick_params(axis='y', labelcolor='#1c4587')

# Create secondary y-axis for volume
ax2 = ax1.twinx()
ax2.bar(meta_df['date'], meta_df['volume'], alpha=0.3, color='#6aa84f', label='Trading Volume', width=5)
ax2.set_ylabel('Trading Volume', fontsize=14, fontweight='bold', color='#6aa84f')
ax2.tick_params(axis='y', labelcolor='#6aa84f')

# Define acquisition dates and details
acquisitions = []
if include_instagram:
    acquisitions.append({'date': '2012-04-09', 'name': 'Instagram', 'price': '$1B', 'y_offset': 50})
if include_whatsapp:
    acquisitions.append({'date': '2014-02-19', 'name': 'WhatsApp', 'price': '$19B', 'y_offset': -80})
if include_giphy:
    acquisitions.append({'date': '2020-05-15', 'name': 'Giphy', 'price': '$400M', 'y_offset': 60})

# Add vertical lines and annotations for each acquisition
for acq in acquisitions:
    acq_date = pd.to_datetime(acq['date'])
    # Check if acquisition date is within the filtered date range
    if acq_date >= pd.to_datetime(start_date) and acq_date <= pd.to_datetime(end_date):
        # Find the closest stock price to the acquisition date
        if len(meta_df) > 0:
            closest_idx = (meta_df['date'] - acq_date).abs().idxmin()
            stock_price = meta_df.loc[closest_idx, 'close']
            
            # Add vertical line with better styling
            ax1.axvline(x=acq_date, color='#cc0000', linestyle='--', alpha=0.6, linewidth=2)
            
            # Add annotation with improved styling
            ax1.annotate(f"{acq['name']}\n{acq['price']}",
                        xy=(acq_date, stock_price),
                        xytext=(30, acq['y_offset']),
                        textcoords='offset points',
                        fontsize=11,
                        fontweight='bold',
                        bbox=dict(boxstyle='round,pad=0.6', facecolor='#fff9e6', edgecolor='#cc0000', alpha=0.9, linewidth=2),
                        arrowprops=dict(arrowstyle='->', connectionstyle='arc3,rad=0.2', color='#cc0000', lw=2))

# Formatting with professional styling
ax1.set_title('Meta (Facebook) Stock Price History with Major Acquisitions', fontsize=18, fontweight='bold', pad=25, color='#1c4587')
ax1.grid(True, alpha=0.25, linestyle='-', linewidth=0.5)

# Combine legends from both axes
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left', fontsize=12, framealpha=0.95, edgecolor='#333333')

# Format x-axis to show dates nicely
ax1.xaxis.set_major_formatter(mdates.DateFormatter('%Y'))
ax1.xaxis.set_major_locator(mdates.YearLocator(2))
plt.xticks(rotation=0, fontsize=11)
ax1.tick_params(axis='both', labelsize=11)
ax2.tick_params(axis='y', labelsize=11)

# Add a subtle background color
ax1.set_facecolor('#f8f9fa')
fig.patch.set_facecolor('white')

# Improve layout
plt.tight_layout()
st.pyplot(fig)

# Meta Metrics
st.header('Meta Revenue and User Growth Metrics')

# Create Meta revenue and user growth metrics around acquisitions
# Note: These are placeholder values - replace with actual data

# Build the metrics data based on configured acquisitions
metrics_data = {
    'acquisition': [],
    'period': [],
    'revenue_billions': [],
    'monthly_active_users_millions': [],
    'user_growth_pct': []
}

if include_instagram:
    metrics_data['acquisition'].extend(['Instagram', 'Instagram'])
    metrics_data['period'].extend(['Before (Q1 2012)', 'After (Q4 2012)'])
    metrics_data['revenue_billions'].extend([1.06, 5.09])
    metrics_data['monthly_active_users_millions'].extend([901, 1056])
    metrics_data['user_growth_pct'].extend([None, 17.2])

if include_whatsapp:
    metrics_data['acquisition'].extend(['WhatsApp', 'WhatsApp'])
    metrics_data['period'].extend(['Before (Q4 2013)', 'After (Q4 2014)'])
    metrics_data['revenue_billions'].extend([7.87, 12.47])
    metrics_data['monthly_active_users_millions'].extend([1393, 1591])
    metrics_data['user_growth_pct'].extend([None, 14.2])

if include_giphy:
    metrics_data['acquisition'].extend(['Giphy', 'Giphy'])
    metrics_data['period'].extend(['Before (Q1 2020)', 'After (Q4 2020)'])
    metrics_data['revenue_billions'].extend([17.74, 28.07])
    metrics_data['monthly_active_users_millions'].extend([2498, 2740])
    metrics_data['user_growth_pct'].extend([None, 9.7])

meta_metrics = pd.DataFrame(metrics_data)

# Revenue and User Growth Comparison
st.header('Revenue and User Growth Comparison')

# Build acquisition data dynamically based on configuration
acquisition_names = []
revenue_before = []
revenue_after = []
users_before = []
users_after = []

if include_instagram:
    acquisition_names.append('Instagram')
    revenue_before.append(1.06)
    revenue_after.append(5.09)
    users_before.append(901)
    users_after.append(1056)

if include_whatsapp:
    acquisition_names.append('WhatsApp')
    revenue_before.append(7.87)
    revenue_after.append(12.47)
    users_before.append(1393)
    users_after.append(1591)

if include_giphy:
    acquisition_names.append('Giphy')
    revenue_before.append(17.74)
    revenue_after.append(28.07)
    users_before.append(2498)
    users_after.append(2740)

# Only create plots if there are acquisitions to display
if len(acquisition_names) > 0:
    # Create subplots for revenue and user growth
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

    x = np.arange(len(acquisition_names))
    width = 0.35

    # Revenue comparison
    rects1 = ax1.bar(x - width/2, revenue_before, width, label='Before Acquisition', color='#6aa84f', alpha=0.8)
    rects2 = ax1.bar(x + width/2, revenue_after, width, label='After Acquisition', color='#1c4587', alpha=0.8)

    ax1.set_xlabel('Acquisition', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Revenue (Billions USD)', fontsize=12, fontweight='bold')
    ax1.set_title('Meta Revenue Before & After Major Acquisitions', fontsize=14, fontweight='bold', pad=15)
    ax1.set_xticks(x)
    ax1.set_xticklabels(acquisition_names)
    ax1.legend(fontsize=10)
    ax1.grid(True, alpha=0.3, axis='y')
    ax1.set_facecolor('#f8f9fa')

    # Add value labels on bars
    for rect in rects1:
        height = rect.get_height()
        ax1.text(rect.get_x() + rect.get_width()/2., height,
                f'${height:.2f}B', ha='center', va='bottom', fontsize=9)
    for rect in rects2:
        height = rect.get_height()
        ax1.text(rect.get_x() + rect.get_width()/2., height,
                f'${height:.2f}B', ha='center', va='bottom', fontsize=9)

    # User growth comparison
    rects3 = ax2.bar(x - width/2, users_before, width, label='Before Acquisition', color='#6aa84f', alpha=0.8)
    rects4 = ax2.bar(x + width/2, users_after, width, label='After Acquisition', color='#1c4587', alpha=0.8)

    ax2.set_xlabel('Acquisition', fontsize=12, fontweight='bold')
    ax2.set_ylabel('Monthly Active Users (Millions)', fontsize=12, fontweight='bold')
    ax2.set_title('Meta User Base Before & After Major Acquisitions', fontsize=14, fontweight='bold', pad=15)
    ax2.set_xticks(x)
    ax2.set_xticklabels(acquisition_names)
    ax2.legend(fontsize=10)
    ax2.grid(True, alpha=0.3, axis='y')
    ax2.set_facecolor('#f8f9fa')

    # Add value labels on bars
    for rect in rects3:
        height = rect.get_height()
        ax2.text(rect.get_x() + rect.get_width()/2., height,
                f'{int(height)}M', ha='center', va='bottom', fontsize=9)
    for rect in rects4:
        height = rect.get_height()
        ax2.text(rect.get_x() + rect.get_width()/2., height,
                f'{int(height)}M', ha='center', va='bottom', fontsize=9)

    fig.patch.set_facecolor('white')
    plt.tight_layout()
    st.pyplot(fig)
else:
    st.write("No acquisitions selected for analysis")

# Competitor Stock Price Comparison
st.header('Competitor Stock Price Comparison')

# Create competitor stock price data (placeholder - replace with actual data)
# Simulating stock prices around the three acquisition dates

# Generate date ranges around each acquisition
instagram_dates = pd.date_range('2012-01-01', '2012-12-31', freq='W')
whatsapp_dates = pd.date_range('2013-08-01', '2014-08-31', freq='W')
giphy_dates = pd.date_range('2019-11-01', '2020-11-30', freq='W')

# Create competitor data for Instagram acquisition period (2012)
competitor_instagram = pd.DataFrame({
    'date': instagram_dates,
    'meta': np.linspace(28, 28, len(instagram_dates)) + np.random.normal(0, 1, len(instagram_dates)),
    'twitter': np.linspace(20, 20, len(instagram_dates)) + np.random.normal(0, 0.8, len(instagram_dates)),
    'linkedin': np.linspace(90, 110, len(instagram_dates)) + np.random.normal(0, 3, len(instagram_dates))
})

# Create competitor data for WhatsApp acquisition period (2014)
competitor_whatsapp = pd.DataFrame({
    'date': whatsapp_dates,
    'meta': np.linspace(50, 75, len(whatsapp_dates)) + np.random.normal(0, 2, len(whatsapp_dates)),
    'twitter': np.linspace(40, 50, len(whatsapp_dates)) + np.random.normal(0, 1.5, len(whatsapp_dates)),
    'linkedin': np.linspace(180, 220, len(whatsapp_dates)) + np.random.normal(0, 5, len(whatsapp_dates))
})

# Create competitor data for Giphy acquisition period (2020)
competitor_giphy = pd.DataFrame({
    'date': giphy_dates,
    'meta': np.linspace(180, 280, len(giphy_dates)) + np.random.normal(0, 8, len(giphy_dates)),
    'snap': np.linspace(15, 45, len(giphy_dates)) + np.random.normal(0, 2, len(giphy_dates)),
    'twitter': np.linspace(30, 45, len(giphy_dates)) + np.random.normal(0, 2, len(giphy_dates))
})



# Build list of subplots based on configuration
subplot_count = sum([include_instagram, include_whatsapp, include_giphy])

if subplot_count > 0:
    # Create dynamic number of subplots
    fig, axes = plt.subplots(subplot_count, 1, figsize=(16, 5 * subplot_count))
    
    # Make axes iterable even if there's only one subplot
    if subplot_count == 1:
        axes = [axes]
    
    subplot_idx = 0
    
    # Instagram acquisition period (2012)
    if include_instagram:
        ax = axes[subplot_idx]
        ax.plot(competitor_instagram['date'], competitor_instagram['meta'], linewidth=2.5, color='#1c4587', label='Meta', marker='o', markersize=4)
        ax.plot(competitor_instagram['date'], competitor_instagram['twitter'], linewidth=2.5, color='#1DA1F2', label='Twitter', marker='s', markersize=4)
        ax.plot(competitor_instagram['date'], competitor_instagram['linkedin'], linewidth=2.5, color='#0077B5', label='LinkedIn', marker='^', markersize=4)
        ax.axvline(x=pd.to_datetime('2012-04-09'), color='#cc0000', linestyle='--', alpha=0.7, linewidth=2, label='Instagram Acquisition')
        ax.set_title('Stock Price Comparison: Instagram Acquisition Period (2012)', fontsize=14, fontweight='bold', pad=15)
        ax.set_ylabel('Stock Price (USD)', fontsize=12, fontweight='bold')
        ax.legend(loc='best', fontsize=10)
        ax.grid(True, alpha=0.3)
        ax.set_facecolor('#f8f9fa')
        subplot_idx += 1
    
    # WhatsApp acquisition period (2014)
    if include_whatsapp:
        ax = axes[subplot_idx]
        ax.plot(competitor_whatsapp['date'], competitor_whatsapp['meta'], linewidth=2.5, color='#1c4587', label='Meta', marker='o', markersize=4)
        ax.plot(competitor_whatsapp['date'], competitor_whatsapp['twitter'], linewidth=2.5, color='#1DA1F2', label='Twitter', marker='s', markersize=4)
        ax.plot(competitor_whatsapp['date'], competitor_whatsapp['linkedin'], linewidth=2.5, color='#0077B5', label='LinkedIn', marker='^', markersize=4)
        ax.axvline(x=pd.to_datetime('2014-02-19'), color='#cc0000', linestyle='--', alpha=0.7, linewidth=2, label='WhatsApp Acquisition')
        ax.set_title('Stock Price Comparison: WhatsApp Acquisition Period (2013-2014)', fontsize=14, fontweight='bold', pad=15)
        ax.set_ylabel('Stock Price (USD)', fontsize=12, fontweight='bold')
        ax.legend(loc='best', fontsize=10)
        ax.grid(True, alpha=0.3)
        ax.set_facecolor('#f8f9fa')
        subplot_idx += 1
    
    # Giphy acquisition period (2020)
    if include_giphy:
        ax = axes[subplot_idx]
        ax.plot(competitor_giphy['date'], competitor_giphy['meta'], linewidth=2.5, color='#1c4587', label='Meta', marker='o', markersize=4)
        ax.plot(competitor_giphy['date'], competitor_giphy['snap'], linewidth=2.5, color='#FFFC00', label='Snap', marker='s', markersize=4)
        ax.plot(competitor_giphy['date'], competitor_giphy['twitter'], linewidth=2.5, color='#1DA1F2', label='Twitter', marker='^', markersize=4)
        ax.axvline(x=pd.to_datetime('2020-05-15'), color='#cc0000', linestyle='--', alpha=0.7, linewidth=2, label='Giphy Acquisition')
        ax.set_title('Stock Price Comparison: Giphy Acquisition Period (2019-2020)', fontsize=14, fontweight='bold', pad=15)
        ax.set_xlabel('Date', fontsize=12, fontweight='bold')
        ax.set_ylabel('Stock Price (USD)', fontsize=12, fontweight='bold')
        ax.legend(loc='best', fontsize=10)
        ax.grid(True, alpha=0.3)
        ax.set_facecolor('#f8f9fa')
    
    fig.patch.set_facecolor('white')
    plt.tight_layout()
    st.pyplot(fig)
else:
    st.write("No acquisitions selected for competitor comparison")

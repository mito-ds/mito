# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import streamlit as st

st.title('actual-app')

def display_viz(fig):
    """Display a visualization in Streamlit based on its type."""
    
    # Check for Plotly figure
    if hasattr(fig, 'update_layout') or str(type(fig)).find('plotly') >= 0:
        st.plotly_chart(fig)
        return
    
    # Check for Matplotlib figure
    if hasattr(fig, 'add_subplot') or str(type(fig)).find('matplotlib') >= 0:
        st.pyplot(fig)
        return
    
    # Fallback - try pyplot as it's most common
    try:
        st.pyplot(fig)
    except Exception:
        st.error(f"Couldn't display visualization of type: {type(fig)}")
        st.write(fig)  # Attempt to display as generic object



# Converting Code Cell
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Parameters
np.random.seed(42)  # for reproducible results
start_date = datetime(2023, 1, 1)
days = 252  # Approx. number of US trading days in a year

# Generate date range for trading days
trading_dates = pd.bdate_range(start=start_date, periods=days)

# Simulate stock prices: Start at $120, random walk
prices = [120]
for _ in range(1, days):
    daily_pct_change = np.random.normal(loc=0.0005, scale=0.02)  # small drift, some volatility
    prices.append(prices[-1] * (1 + daily_pct_change))

tesla_stock_df = pd.DataFrame({
    'date': trading_dates,
    'close': prices
})

tesla_stock_df.head() 

# Converting Code Cell
# Ensure plots render inside the notebook
import matplotlib.pyplot as plt

plt.figure(figsize=(12,6))
plt.plot(tesla_stock_df['date'], tesla_stock_df['close'], label='TESLA Close Price', color='tab:blue')

# Normalized performance (cumulative return, rebased to 100)
base = tesla_stock_df['close'].iloc[0]
plt.plot(tesla_stock_df['date'], (tesla_stock_df['close'] / base) * 100, label='Normalized Performance (start=100)', linestyle='--', color='tab:orange')

plt.title('Fake Tesla Stock: Price and Performance Over Time')
plt.xlabel('Date')
plt.ylabel('Price / Performance Index')
plt.legend()
plt.grid(True)
plt.tight_layout()
display_viz(plt.gcf())

# Converting Code Cell
# Summary stats for the closing price
close_summary = tesla_stock_df['close'].describe()
close_summary 

# Converting Code Cell
# Calculate daily returns

tesla_stock_df['daily_return'] = tesla_stock_df['close'].pct_change()

# Summary stats for the daily returns
return_summary = tesla_stock_df['daily_return'].describe()
return_summary 

# Converting Code Cell

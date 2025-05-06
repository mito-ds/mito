import streamlit as st
import pandas as pd
import numpy as np

st.title('Untitled')

st.markdown("""# META (Facebook) 2024 Stock Price Analysis

This notebook conducts an analysis of META (Facebook) stock price data for all trading days after January 1, 2024. It covers data loading, summary statistics, missing value checks, price visualization, and insights on volatility and high-volume trading days.

**Dataset:** `meta_stock_prices.csv` """)

# Code Cell
import pandas as pd

# Code Cell
mito_app_date_input_cutoff_date = st.date_input('cutoff_date', '2024/01/01')

st.markdown("""## Data Import and Preprocessing

- The dataset is loaded from a CSV file.
- The `date` column is converted to datetime (timezone information is removed).
- Data is filtered to include only days after January 1, 2024.
 """)

# Code Cell
# Imported meta_stock_prices.csv
meta_stock_prices = pd.read_csv(r'meta_stock_prices.csv')

# Convert the date column to datetime (assuming it is named 'date'), removing timezones if present
meta_stock_prices['date'] = pd.to_datetime(meta_stock_prices['date'], utc=True).dt.tz_localize(None)

# Filter for dates after Jan 1, 2024, also as tz-naive
filter_date = pd.to_datetime(mito_app_date_input_cutoff_date)
meta_stock_prices = meta_stock_prices[meta_stock_prices['date'] > filter_date]

# Code Cell
meta_stock_prices

st.markdown("""## Price Visualization

- Visualize the META closing price over time to observe trends, anomalies, and general behavior during 2024. """)

# Modified code for Streamlit:
import matplotlib.pyplot as plt

plt.figure(figsize=(12,6))
plt.plot(meta_stock_prices['date'], meta_stock_prices['close'], marker='o')
plt.title('META Closing Price Over Time (2024)')
plt.xlabel('Date')
plt.ylabel('Closing Price ($)')
plt.grid(True)
plt.tight_layout()
st.pyplot(plt.gcf())
st.markdown("""## Insights and Key Metrics""")

# Code Cell
# Find the date and value of the max close
max_close_idx = meta_stock_prices['close'].idxmax()
max_close = meta_stock_prices.at[max_close_idx, 'close']
max_close_date = meta_stock_prices.at[max_close_idx, 'date']

# Find the date and value of the min close
min_close_idx = meta_stock_prices['close'].idxmin()
min_close = meta_stock_prices.at[min_close_idx, 'close']
min_close_date = meta_stock_prices.at[min_close_idx, 'date']

max_close, max_close_date, min_close, min_close_date 

# Code Cell
print(f"Highest closing price: ${max_close:.2f} on {max_close_date.date()}")
print(f"Lowest closing price:  ${min_close:.2f} on {min_close_date.date()}") 

# Code Cell
first_close = meta_stock_prices.iloc[0]['close']
last_close = meta_stock_prices.iloc[-1]['close']
percent_gain = ((last_close - first_close) / first_close) * 100

print(f"Percent gain from {meta_stock_prices.iloc[0]['date'].date()} to {meta_stock_prices.iloc[-1]['date'].date()}: {percent_gain:.2f}%") 

# Code Cell
# Compute daily returns and their standard deviation
meta_stock_prices['daily_return'] = meta_stock_prices['close'].pct_change()
daily_volatility = meta_stock_prices['daily_return'].std() * 100  # percent
print(f"Standard deviation of daily returns: {daily_volatility:.2f}%") 

# Code Cell
volume_cutoff = meta_stock_prices['volume'].quantile(0.99)
high_volume_days = meta_stock_prices[meta_stock_prices['volume'] > volume_cutoff][['date', 'volume']]
high_volume_days 

# Code Cell


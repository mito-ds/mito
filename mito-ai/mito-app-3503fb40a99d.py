import pandas as pd
import matplotlib.pyplot as plt
import streamlit as st

st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        .stAppDeployButton {display:none;}
        footer {visibility: hidden;}
        .stMainBlockContainer {padding: 2rem 1rem 2rem 1rem;}
    </style>
""", unsafe_allow_html=True)

st.title("Meta Stock Price Analysis")

# Load data
url = 'https://raw.githubusercontent.com/mito-ds/mito/refs/heads/dev/jupyterhub/meta_stock_prices.csv'
meta_df = pd.read_csv(url)

st.subheader("Data Preview")
st.dataframe(meta_df.head(10))

# Convert date to datetime
meta_df['date'] = pd.to_datetime(meta_df['date'])

# Create figure and axis
fig, ax = plt.subplots(figsize=(14, 7))

# Plot the closing price
ax.plot(meta_df['date'], meta_df['close'], color='#1877F2', linewidth=2.5, label='Meta Stock Price')

# Define acquisition dates and details
acquisitions = [
    {'date': pd.to_datetime('2012-04-09'), 'name': 'Instagram', 'price': 38.23},
    {'date': pd.to_datetime('2014-02-19'), 'name': 'WhatsApp', 'price': 68.5},
    {'date': pd.to_datetime('2020-05-13'), 'name': 'Giphy', 'price': 230.0}
]

# Add vertical lines and annotations for each acquisition
for acq in acquisitions:
    ax.axvline(x=acq['date'], color='#E4405F', linestyle='--', alpha=0.7, linewidth=1.5)
    ax.annotate(
        f"{acq['name']}\nAcquisition",
        xy=(acq['date'], acq['price']),
        xytext=(10, 20),
        textcoords='offset points',
        fontsize=10,
        bbox=dict(boxstyle='round,pad=0.5', facecolor='yellow', alpha=0.7),
        arrowprops=dict(arrowstyle='->', connectionstyle='arc3,rad=0', color='#E4405F')
    )

# Customize the plot
ax.set_xlabel('Date', fontsize=12)
ax.set_ylabel('Stock Price ($)', fontsize=12)
ax.set_title('Meta Stock Price and Major Acquisitions', fontsize=14, fontweight='bold')
ax.grid(True, alpha=0.3)
ax.legend(fontsize=12, loc='upper left')

plt.tight_layout()
st.pyplot(fig)

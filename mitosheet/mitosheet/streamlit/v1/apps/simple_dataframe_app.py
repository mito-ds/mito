# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import numpy as np
import pandas as pd
import streamlit as st

from mitosheet.streamlit.v1 import spreadsheet

st.set_page_config(layout="wide")
st.title("Mito sample sheet — suggested formulas demo")

st.caption(
    "Rich numeric mix: try **Home → Suggested formulas** to see ghost columns (line subtotal, margin, etc.)."
)

rng = np.random.default_rng(7)
n = 48
df = pd.DataFrame(
    {
        "product": [f"SKU-{100 + i % 12}" for i in range(n)],
        "channel": rng.choice(["web", "retail", "partner"], size=n, p=[0.5, 0.35, 0.15]),
        "units_sold": rng.integers(1, 120, size=n, dtype=np.int64),
        "list_price": np.round(rng.uniform(9.99, 249.0, size=n), 2),
        "unit_cost": np.round(rng.uniform(3.0, 140.0, size=n), 2),
        "rebate_pct": np.round(rng.uniform(0.0, 22.0, size=n), 1),
        "ship_cost": np.round(rng.uniform(0.0, 18.0, size=n), 2),
        "region": rng.choice(["NA", "EU", "APAC"], size=n),
    }
)

new_dfs, code = spreadsheet(df)

st.subheader("Result dataframes")
st.write(new_dfs)
st.subheader("Generated code")
st.code(code)

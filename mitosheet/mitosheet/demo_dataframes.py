# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
Sample dataframes for demos (JupyterLab, Streamlit, etc.).

Use in a notebook::

    import mitosheet as ms
    df = ms.build_demo_dataframe(200)
    ms.sheet(df)

Then **Home → Suggested formulas** to load ghost columns (e.g. unit_price + shipping_fee).
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def build_demo_dataframe(num_rows: int = 400, random_seed: int = 42) -> pd.DataFrame:
    """Build a wide-ish, larger-than-toy sheet for Mito demos."""
    if num_rows < 8:
        num_rows = 8

    rng = np.random.default_rng(random_seed)
    n = num_rows

    categories = np.array(["widgets", "gadgets", "cables", None], dtype=object)
    cat_p = np.array([0.38, 0.38, 0.19, 0.05])
    category = rng.choice(categories, size=n, p=cat_p)

    units = rng.integers(1, 80, size=n, dtype=np.int64)

    unit_price = np.round(rng.normal(18.0, 12.0, size=n), 2)
    unit_price = np.clip(unit_price, 0.99, None)
    nan_price = rng.random(n) < 0.08
    unit_price = unit_price.astype(float)
    unit_price[nan_price] = np.nan

    shipping_fee = np.round(rng.normal(6.5, 2.2, size=n), 2)
    shipping_fee = np.clip(shipping_fee, 0.0, None)
    nan_ship = rng.random(n) < 0.05
    shipping_fee = shipping_fee.astype(float)
    shipping_fee[nan_ship] = np.nan

    outlier_mask = rng.random(n) < 0.04
    if np.any(outlier_mask):
        units = units.copy()
        units[outlier_mask] = rng.integers(2000, 12000, size=int(outlier_mask.sum()))

    regions = np.array(["NA", "EU", "APAC", None], dtype=object)
    region = rng.choice(regions, size=n, p=[0.42, 0.38, 0.15, 0.05])

    status_choices = np.array(
        [
            "Shipped",
            "shipped",
            "SHIPPED",
            "PENDING",
            "pending",
            "Cancelled",
            "Shipped",
        ],
        dtype=object,
    )
    status = rng.choice(status_choices, size=n, p=[0.35, 0.12, 0.08, 0.1, 0.08, 0.07, 0.2])

    df = pd.DataFrame(
        {
            "sku": [f"W-{100 + (i % 95)}" for i in range(n)],
            "category": category,
            "region": region,
            "status": status,
            "unit_price": unit_price,
            "shipping_fee": shipping_fee,
            "units": units,
            "discount_pct": rng.integers(0, 16, size=n, dtype=np.int64),
            "ship_mode": np.where(rng.integers(0, 2, size=n) == 0, "Standard", "Express"),
            "customer_email": [
                f"user{(i * 17) % 240}@{'example.com' if i % 2 == 0 else 'test.org'}"
                for i in range(n)
            ],
            "notes": rng.choice(
                ["ok", "rush", "fragile", "", None, "see invoice", "RETURNS"],
                size=n,
                p=[0.35, 0.12, 0.08, 0.25, 0.08, 0.07, 0.05],
            ),
            "txn_id": np.arange(10_000, 10_000 + n, dtype=np.int64),
        }
    )

    dup = df.iloc[[1, min(5, n - 1)]].copy()
    dup["txn_id"] = [10_000 + n, 10_000 + n + 1]
    df = pd.concat([df, dup], ignore_index=True)

    return df

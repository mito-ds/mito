# Fund Allocation Demo

## Setup

1. Copy the three CSV files into your notebook working directory.
2. Copy the verified report into `~/.mito/verified_reports/` (this is where Mito loads snippets at runtime — same place as `retention.json`):
   ```bash
   mkdir -p ~/.mito/verified_reports
   cp fund-allocation-report.json ~/.mito/verified_reports/
   ```
3. In a fresh notebook, load the data:
   ```python
   import pandas as pd

   positions_df = pd.read_csv('portfolio_positions.csv')
   ips_df = pd.read_csv('ips_targets.csv')
   returns_df = pd.read_csv('quarterly_returns.csv')
   ```

## Demo prompts

**PM question (sets up the doc):**

> How does our current portfolio allocation compare to our IPS targets as of Q1 2026?

Expected headline: US Equity is 46% vs a 40% target; Fixed Income and Intl Equity are underweight.

**Reviewer question (the reactive moment):**

> Which asset classes are outside their rebalance bands?

Expected result: US Equity, Fixed Income, and Intl Equity all flag `outside_band = True`.

Optional follow-up:

> What dollar trades would bring each overweight/underweight sleeve back to target?

## Data files

| File | Description |
|------|-------------|
| `portfolio_positions.csv` | Current holdings ($200M AUM, as of 2026-03-31) |
| `ips_targets.csv` | IPS target weights, min/max ranges, and rebalance bands |
| `quarterly_returns.csv` | Quarterly returns by fund (2023–Q1 2026) |

## Verified snippets

`fund-allocation-report.json` contains two snippets the agent can reuse:

1. **Current allocation weights** — roll positions up to asset-class weights
2. **IPS drift check** — compare weights to targets and flag sleeves outside rebalance bands

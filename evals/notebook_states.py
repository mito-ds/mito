# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from evals.eval_types import NotebookState
import pandas as pd
import numpy as np

EMPTY_NOTEBOOK: NotebookState = NotebookState(
  global_vars={},
  cell_contents=[]
)

EMPTY_NOTEBOOK_WITH_PANDAS: NotebookState = NotebookState(
    global_vars={},
    cell_contents=['import pandas as pd', '']
)

INITIALIZED_VARIABLES_NOTEBOOK: NotebookState = NotebookState(
  global_vars={'x': 1, 'y': 2, 'z': 3},
  cell_contents=['x = 1', 'y = 2', 'z = 3', '']
)

MESSY_DATA_NOTEBOOK: NotebookState = NotebookState(
    global_vars={'df': pd.read_csv('evals/data/messy_data.csv').head(5)},
    cell_contents=["""import pandas as pd
df = pd.read_csv('evals/data/messy_data.csv')""", '']
)

LOANS_DF_NOTEBOOK: NotebookState = NotebookState(
    global_vars={'loans_df': pd.read_csv('evals/data/loans.csv').head(5)},
    cell_contents=["""import pandas as pd
loans_df = pd.read_csv('evals/data/loans.csv')""", '']
)

USED_CARS_DF_NOTEBOOK: NotebookState = NotebookState(
    global_vars={'used_cars_df': pd.read_csv('evals/data/used_cars.csv').head(5)},
    cell_contents=["""import pandas as pd
used_cars_df = pd.read_csv('evals/data/used_cars.csv')""", '']
)

SIMPLE_RECON_NOTEBOOK: NotebookState = NotebookState(
    global_vars={
        'excel_transactions': pd.read_csv('evals/data/simple_recon/transactions_excel.csv').head(5), 
        'eagle_transactions': pd.read_csv('evals/data/simple_recon/transactions_eagle.csv').head(5)
    },
    cell_contents=["""import pandas as pd
excel_transactions = pd.read_csv('evals/data/simple_recon/transactions_excel.csv')
eagle_transactions = pd.read_csv('evals/data/simple_recon/transactions_eagle.csv')
""", '']
)

MONTHLY_EQUITY_NOTEBOOK: NotebookState = NotebookState(
    global_vars={
        'july_balances': pd.read_csv('evals/data/monthly_equity/july_balances.csv').head(5),
        'july_fees': pd.read_csv('evals/data/monthly_equity/july_fees.csv').head(5),
        'august_balances': pd.read_csv('evals/data/monthly_equity/august_balances.csv').head(5),
        'august_fees': pd.read_csv('evals/data/monthly_equity/august_fees.csv').head(5)
    },
    cell_contents=["""import pandas as pd
july_balances = pd.read_csv('evals/data/monthly_equity/july_balances.csv')
july_fees = pd.read_csv('evals/data/monthly_equity/july_fees.csv')
august_balances = pd.read_csv('evals/data/monthly_equity/august_balances.csv')
august_fees = pd.read_csv('evals/data/monthly_equity/august_fees.csv')
""", '']
)

COMPANIES_ACTIVE_MONTHS_NOTEBOOK: NotebookState = NotebookState(
    global_vars={'df': pd.DataFrame({
        'company_name': ['Apple', 'Google', 'Microsoft', 'Amazon', 'Apple'],
        'currently_active': [True, True, True, True, False],
        'active_in_june': [True, False, True, True, True],
        'active_in_july': [False, True, True, False, True],
        'active_in_august': [False, True, False, False, False],
        'active_in_september': [True, False, True, False, True],
        'active_in_october': [True, True, False, False, True],
        'active_in_november': [False, False, False, True, True],
        'active_in_december': [True, False, False, False, False],
        'active_in_january': [True, False, True, False, False],
    })},
    cell_contents=["""import pandas as pd
df = pd.DataFrame({
    'company_name': ['Apple', 'Google', 'Microsoft', 'Amazon', 'Apple'],
    'currently_active': [True, True, True, True, False],
    'active_in_june': [True, False, True, True, True],
    'active_in_july': [False, True, True, False, True],
    'active_in_august': [False, True, False, False, False],
    'active_in_september': [True, False, True, False, True],
    'active_in_october': [True, True, False, False, True],
    'active_in_november': [False, False, False, True, True],
    'active_in_december': [True, False, False, False, False],
    'active_in_january': [True, False, True, False, False],
})""", '']
)



np.random.seed(42)
stock_df = pd.DataFrame({
    'date': pd.date_range(start='2023-01-01', periods=100),
    'ticker': np.random.choice(['AAPL', 'GOOGL', 'MSFT', 'AMZN'], 100),
    'price': np.random.uniform(100, 1000, 100),
    'volume': np.random.randint(1000, 1000000, 100),
    'market_cap': ['$1.5T', '$800B', '$2.1T', '$1.2T'] * 25,
    'sector': ['Tech', 'Tech', 'Tech', 'Consumer'] * 25,
    'pe_ratio': np.random.uniform(10, 50, 100),
    'dividend_yield': ['2.5%', '1.8%', None, '0%'] * 25
})
STOCK_MARKET_DATA_NOTEBOOK: NotebookState = NotebookState(
    global_vars={'stock_df': stock_df.head(5)},
    cell_contents=["""import pandas as pd
import numpy as np
np.random.seed(42)
stock_df = pd.DataFrame({
    'date': pd.date_range(start='2023-01-01', periods=100),
    'ticker': np.random.choice(['AAPL', 'GOOGL', 'MSFT', 'AMZN'], 100),
    'price': np.random.uniform(100, 1000, 100),
    'volume': np.random.randint(1000, 1000000, 100),
    'market_cap': ['$1.5T', '$800B', '$2.1T', '$1.2T'] * 25,
    'sector': ['Tech', 'Tech', 'Tech', 'Consumer'] * 25,
    'pe_ratio': np.random.uniform(10, 50, 100),
    'dividend_yield': ['2.5%', '1.8%', None, '0%'] * 25
})""", '']
)

RETURNS_DICT_NOTEBOOK: NotebookState = NotebookState(
    global_vars={
        'returns': {
            '2020': {
                'current_close': 100,
                'previous_close': 50,
            },
            '2021': {
                'current_close': 150,
                'previous_close': 100,
            },
            '2022': {
                'current_close': 200,
                'previous_close': 150,
            },
            '2023': {
                'current_close': 250,
                'previous_close': 200,
            },
            '2024': {
                'current_close': 300,
                'previous_close': 250,
            },
        }
    },
    cell_contents=["""

returns = {
    '2020': {
        'current_close': 100,
        'previous_close': 50,
    },
    '2021': {
        'current_close': 150,
        'previous_close': 100,
    },
    '2022': {
        'current_close': 200,
        'previous_close': 150,
    },
    '2023': {
        'current_close': 250,
        'previous_close': 200,
    },
    '2024': {
        'current_close': 300,
        'previous_close': 250,
    },
}

""", '']
)


nba_players_df = pd.DataFrame({
    'player_name': [
        'LeBron James', 'Kevin Durant', 'Stephen Curry', 'Giannis Antetokounmpo',
        'Kawhi Leonard', 'James Harden', 'Luka Dončić', 'Damian Lillard',
        'Joel Embiid', 'Nikola Jokić', 'Anthony Davis', 'Chris Paul',
        'Jayson Tatum', 'Zion Williamson', 'Devin Booker'
    ],
    'team': [
        'Los Angeles Lakers', 'Brooklyn Nets', 'Golden State Warriors', 'Milwaukee Bucks',
        'Los Angeles Clippers', 'Brooklyn Nets', 'Dallas Mavericks', 'Portland Trail Blazers',
        'Philadelphia 76ers', 'Denver Nuggets', 'Los Angeles Lakers', 'Phoenix Suns',
        'Boston Celtics', 'New Orleans Pelicans', 'Phoenix Suns'
    ],
    'position': [
        'SF', 'PF', 'PG', 'PF',
        'SF', 'SG', 'PG', 'PG',
        'C', 'C', 'PF', 'PG',
        'SF', 'PF', 'SG'
    ],
    'points_per_game': [
        25.0, 27.0, 29.0, 28.0,
        24.0, 25.0, 28.0, 27.0,
        33.0, 26.0, 22.0, 18.0,
        26.0, 22.0, 25.0
    ]
})

NBA_PLAYERS_NOTEBOOK: NotebookState = NotebookState(
    global_vars={'nba_players_df': nba_players_df.head(5)},
    cell_contents=["""import pandas as pd
nba_players_df = pd.DataFrame({
    'player_name': [
        'LeBron James', 'Kevin Durant', 'Stephen Curry', 'Giannis Antetokounmpo',
        'Kawhi Leonard', 'James Harden', 'Luka Dončić', 'Damian Lillard',
        'Joel Embiid', 'Nikola Jokić', 'Anthony Davis', 'Chris Paul',
        'Jayson Tatum', 'Zion Williamson', 'Devin Booker'
    ],
    'team': [
        'Los Angeles Lakers', 'Brooklyn Nets', 'Golden State Warriors', 'Milwaukee Bucks',
        'Los Angeles Clippers', 'Brooklyn Nets', 'Dallas Mavericks', 'Portland Trail Blazers',
        'Philadelphia 76ers', 'Denver Nuggets', 'Los Angeles Lakers', 'Phoenix Suns',
        'Boston Celtics', 'New Orleans Pelicans', 'Phoenix Suns'
    ],
    'position': [
        'SF', 'PF', 'PG', 'PF',
        'SF', 'SG', 'PG', 'PG',
        'C', 'C', 'PF', 'PG',
        'SF', 'PF', 'SG'
    ],
    'points_per_game': [
        25.0, 27.0, 29.0, 28.0,
        24.0, 25.0, 28.0, 27.0,
        33.0, 26.0, 22.0, 18.0,
        26.0, 22.0, 25.0
    ]
})""", '']
)
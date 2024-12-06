from evals.eval_types import NotebookState
import pandas as pd


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
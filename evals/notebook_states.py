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
    global_vars={'df': pd.DataFrame({
    'Transaction_ID': [1, 2, 3, 4, 5],
    'Date': ['1/1/23', '1/2/23', '1/2/23', '1/2/23', '3/5/23'],
    'Stock': ['APPLE-Stock', 'ALPHABET-Stock', 'MICROSOFT-Stock', 'AMAZON-Stock', 'APPLE-Stock'],
    'Transaction_Price': ['$185.37', '$122.58', '$337.02', '$125.00', '$187.91'],
    'Type_of_Investment': ['Stock', 'Stock', 'Stock', 'Stock', 'Stock'],
    'Description_of_each_transaction': [
        'AAPL shares purchased',
        'GOOGL shares purchased',
        'MSFT shares purchased',
        'AMZN shares purchased',
        'AAPL shares purchased'
    ]
})},
    cell_contents=["""import pandas as pd
df = pd.read_csv('evals/data/messy_data.csv')""", '']
)

LOANS_DF_NOTEBOOK: NotebookState = NotebookState(
    global_vars={'loans_df': pd.DataFrame({
        'issue_date': ['2011-01-12', '2011-01-12'],
        'income_category': ['Low', 'Low'],
        'annual_income': [24000, 30000],
        'loan_amount': [5000, 2500],
        'term': ['36 months', '60 months'],
        'purpose': ['credit_card', 'car'],
        'interest_payments': ['Low', 'High'],
        'loan_condition': ['Good Loan', 'Bad Loan'],
        'interest_rate': [10.65, 15.27],
        'total_pymnt': [5861.071414, 1008.710000],
        'total_rec_prncp': [5000.00, 456.46]
    })},
    cell_contents=["""import pandas as pd
loans_df = pd.read_csv('evals/data/loans.csv')""", '']
)

USED_CARS_DF_NOTEBOOK: NotebookState = NotebookState(
    global_vars={'used_cars_df': pd.DataFrame({
        'Brand': ['Honda', 'Toyota', 'Volkswagen', 'Maruti Suzuki', 'Maruti Suzuki'],
        'model': ['City', 'Innova', 'VentoTest', 'Swift', 'Baleno'],
        'Year': [2001, 2009, 2010, 2017, 2019],
        'Age': [23, 15, 14, 7, 5],
        'kmDriven': [98000.0, 190000.0, 77246.0, 83500.0, 45000.0],
        'Transmission': ['Manual', 'Manual', 'Manual', 'Manual', 'Automatic'],
        'Owner': ['second', 'second', 'first', 'second', 'first'],
        'FuelType': ['Petrol', 'Diesel', 'Diesel', 'Diesel', 'Petrol'],
        'PostedDate': ['Nov-24', 'Jul-24', 'Nov-24', 'Nov-24', 'Nov-24'],
        'AdditionInfo': [
            'Honda City v teck in mint condition, valid genuine car,',
            'Toyota Innova 2.5 G (Diesel) 7 Seater, 2009, Diesel',
            'Volkswagen Vento 2010-2013 Diesel Breeze, 2010, Diesel',
            'Maruti Suzuki Swift 2017 Diesel Good Condition',
            'Maruti Suzuki Baleno Alpha CVT, 2019, Petrol'
        ],
        'AskPrice': ['₹ 1,95,000', '₹ 3,75,000', '₹ 1,84,999', '₹ 5,65,000', '₹ 6,85,000']
    })},
    cell_contents=["""import pandas as pd
used_cars_df = pd.read_csv('evals/data/used_cars.csv')""", '']
)

SIMPLE_RECON_NOTEBOOK: NotebookState = NotebookState(
    global_vars={
        'excel_transactions': pd.DataFrame({'Transaction ID': [12975, 16889, 57686, 53403, 42699], 'Share Quantity': [20, 25, 24, 22, 40]}), 
        'excel_transactions': pd.DataFrame({'Transaction ID': [12975, 16889, 57686, 53403, 42699], 'Share Quantity': [20, 25, 24, 22, 0]})},
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

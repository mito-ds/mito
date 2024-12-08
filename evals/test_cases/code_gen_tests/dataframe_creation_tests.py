from evals.eval_types import CodeGenTestCase, CodeGenTestCaseCore
from evals.notebook_states import *

DATAFRAME_CREATION_TESTS = [
    CodeGenTestCase(
        name="import_csv",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK_WITH_PANDAS,
            expected_code="loans_df = pd.read_csv('evals/data/loans.csv')",
            tags=["df_creation", "pandas"],
        ),
        user_input="Create a datafame called loans_df by importing the csv using the path 'evals/data/loans.csv'",
    ),
    CodeGenTestCase(
        name="dataframe_creation_from_dict",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK_WITH_PANDAS,
            expected_code="""used_cars_df = pd.DataFrame({
    'Brand': ['Honda', 'Toyota'],
    'model': ['City', 'Innova'],
    'Year': [2001, 2009],
    'Age': [23, 15],
    'kmDriven': [98000.0, 190000.0],
    'Transmission': ['Manual', 'Manual'],
    'Owner': ['second', 'second'],
    'FuelType': ['Petrol', 'Diesel'],
    'PostedDate': ['Nov-24', 'Jul-24'],
    'AdditionInfo': [
        'Honda City v teck in mint condition, valid genuine car,',
        'Toyota Innova 2.5 G (Diesel) 7 Seater, 2009, Diesel',
    ],
    'AskPrice': ['₹ 1,95,000', '₹ 3,75,000']
})""",
            tags=["df_creation", "pandas"],
        ),
        user_input="""Create a dataframe called used_cars_df that contains this data:
        
[{'Brand': 'Honda',
  'model': 'City',
  'Year': 2001,
  'Age': 23,
  'kmDriven': 98000.0,
  'Transmission': 'Manual',
  'Owner': 'second',
  'FuelType': 'Petrol',
  'PostedDate': 'Nov-24',
  'AdditionInfo': 'Honda City v teck in mint condition, valid genuine car,',
  'AskPrice': '₹ 1,95,000'},
 {'Brand': 'Toyota',
  'model': 'Innova',
  'Year': 2009,
  'Age': 15,
  'kmDriven': 190000.0,
  'Transmission': 'Manual',
  'Owner': 'second',
  'FuelType': 'Diesel',
  'PostedDate': 'Jul-24',
  'AdditionInfo': 'Toyota Innova 2.5 G (Diesel) 7 Seater, 2009, Diesel',
  'AskPrice': '₹ 3,75,000'}]
        """,
    ),
    CodeGenTestCase(
        name="dataframe_creation_from_for_loop",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK_WITH_PANDAS,
            expected_code="df = pd.DataFrame({'numbers': range(1, 1001)})",
            tags=["df_creation", "pandas"],
        ),
        user_input="Create a new dataframe with a column called 'numbers' that contains the numbers 1 through 1000",
    ),
    CodeGenTestCase(
        name="dataframe_creation_from_url",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK_WITH_PANDAS,
            expected_code="df = pd.read_csv('https://raw.githubusercontent.com/plotly/datasets/master/tesla-stock-price.csv')",
            tags=["df_creation", "pandas"],
        ),
        user_input="Create a `df` from this url https://raw.githubusercontent.com/plotly/datasets/master/tesla-stock-price.csv",
    ),
]

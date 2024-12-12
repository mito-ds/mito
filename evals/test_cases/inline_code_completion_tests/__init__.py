from evals.eval_types import ChatTestCase, CodeGenTestCaseCore
from evals.notebook_states import *

DATAFRAME_CREATION_TESTS = [
    ChatTestCase(
        name="import_csv",
        test_case_core=CodeGenTestCaseCore(
            notebook_state=EMPTY_NOTEBOOK_WITH_PANDAS,
            expected_code="loans_df = pd.read_csv('evals/data/loans.csv')",
            tags=["df_creation", "pandas"],
        ),
        user_input="Create a datafame called loans_df by importing the csv using the path 'evals/data/loans.csv'",
    ),
]

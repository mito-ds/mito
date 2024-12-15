

from evals.eval_types import InlineCodeCompletionTestCase
from evals.test_cases.chat_tests.dataframe_transformation_tests import FILTER_ANNUAL_INCOME_GREATER_THAN_100K


DATAFRAME_TRANSFORMATION_TESTS = [
    # Complete basic filter condition
    InlineCodeCompletionTestCase(
        name="complete_basic_filter_condition",
        test_case_core=FILTER_ANNUAL_INCOME_GREATER_THAN_100K,
        prefix=""""# Filter the annual income column to > 100k""",
        suffix="",
        type_tags=['comment_following'],
    ),
    
    # Complete filter with just bracket
    InlineCodeCompletionTestCase(
        name="complete_filter_bracket",
        test_case_core=FILTER_ANNUAL_INCOME_GREATER_THAN_100K,
        prefix="loans_df = loans_df[loans_df['annual_income'] > 100000",
        suffix="",
        type_tags=['code_completion'],
    ),

]
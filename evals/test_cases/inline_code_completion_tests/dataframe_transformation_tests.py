

from evals.eval_types import InlineCodeCompletionTestCase
from evals.test_cases.chat_tests.dataframe_transformation_tests import DATETIME_CONVERSION, EXTRACT_YEAR_FROM_STRING_DATE, FILTER_ANNUAL_INCOME_AND_LOAN_CONDITION, FILTER_ANNUAL_INCOME_GREATER_THAN_100K


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

    # Complete filter with multiple conditions - comment following
    InlineCodeCompletionTestCase(
        name="complete_filter_bracket_with_comment",
        test_case_core=FILTER_ANNUAL_INCOME_AND_LOAN_CONDITION,
        prefix=""""# Filter the annual income column to > 100k and the loan condition to bad loans""",
        suffix="",
        type_tags=['comment_following'],
    ),

    # Complete filter with multiple conditions - no comment
    # Must infer the remainder of filter condition from understanding of the data. 
    InlineCodeCompletionTestCase(
        name="complete_condition_from_data_understanding",
        test_case_core=FILTER_ANNUAL_INCOME_AND_LOAN_CONDITION,
        prefix="loans_df = loans_df[loans_df['annual_income'] > 100000 & loans_df['loan_condition'] == 'Bad ",
        suffix="",
        type_tags=['code_completion'],
    ),

    # Infer the format the datetime based on the data
    InlineCodeCompletionTestCase(
        name="datetime_conversion_infer_format",
        test_case_core=DATETIME_CONVERSION,
        prefix="loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format=",
        suffix="",
        type_tags=['code_completion'],
    ),

    # Create datetime conversion based on suffix dtype reliance
    InlineCodeCompletionTestCase(
        name="extract_year_from_date_infer_from_suffix",
        test_case_core=EXTRACT_YEAR_FROM_STRING_DATE,
        prefix="""""",
        suffix="loans_df['year'] = loans_df['issue_date'].dt.year",
        type_tags=['code_completion'],
    ),

    # Extract year from date
    InlineCodeCompletionTestCase(
        name="extract_year_from_date_finish_code",
        test_case_core=EXTRACT_YEAR_FROM_STRING_DATE,
        prefix="""loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format='%Y-%m-%d', errors='coerce')
loans_df['year'] = 
        """,
        suffix="",
        type_tags=['code_completion'],
    ),

    # Extract year from date -- comment following
    InlineCodeCompletionTestCase(
        name="extract_year_from_date_comment_following",
        test_case_core=EXTRACT_YEAR_FROM_STRING_DATE,
        prefix=""""# Extract the year from the issue date""",
        suffix="",
        type_tags=['comment_following'],
    ),

    # Extract year from date -- complete. No intent expressed.
    # Intent defined in comment.
    InlineCodeCompletionTestCase(
        name="extract_year_from_date_finished_in_suffix",
        test_case_core=EXTRACT_YEAR_FROM_STRING_DATE,
        prefix=""""# Extract the year from the issue date""",
        suffix="""loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format='%Y-%m-%d', errors='coerce')
loans_df['year'] = loans_df['issue_date'].dt.year""",
        type_tags=['no_expressed_intent'],
    ),

    # Extract year from date -- complete. No intent expressed.
    # Intent defined in comment.
    InlineCodeCompletionTestCase(
        name="extract_year_from_date_finished_in_prefix",
        test_case_core=EXTRACT_YEAR_FROM_STRING_DATE,
        prefix=""""# Extract the year from the issue date
loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format='%Y-%m-%d', errors='coerce')
loans_df['year'] = loans_df['issue_date'].dt.year""",
        suffix="""""",
        type_tags=['no_expressed_intent'],
    ),

    # Extract year from date -- complete. No intent expressed.
    # No comment explicittly stating the intent. 
    # Hypothesis: If the intent is explicitly stated in a comment, the AI is more likely to identify 
    # that the intent is complete and not return additional code. 
    InlineCodeCompletionTestCase(
        name="extract_year_from_date_finished_in_prefix_no_comment",
        test_case_core=EXTRACT_YEAR_FROM_STRING_DATE,
        prefix=""""loans_df['issue_date'] = pd.to_datetime(loans_df['issue_date'], format='%Y-%m-%d', errors='coerce')
loans_df['year'] = loans_df['issue_date'].dt.year""",
        suffix="""""",
        type_tags=['no_expressed_intent'],
    ),



]

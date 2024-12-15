

from evals.eval_types import InlineCodeCompletionTestCase
from evals.test_cases.chat_tests.dataframe_transformation_tests import CONVERT_ANNUAL_INCOME_TO_FLOAT, CONVERT_INTEREST_RATE_TO_INT, CONVERT_KILOMETERS_DRIVEN_TO_FLOAT, DATETIME_CONVERSION, EXTRACT_YEAR_FROM_STRING_DATE, FILTER_ANNUAL_INCOME_AND_LOAN_CONDITION, FILTER_ANNUAL_INCOME_GREATER_THAN_100K, REPLACE_UNDERSCORE_WITH_SPACE_IN_COLUMN_NAMES


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

    # Convert annual income to float 
    InlineCodeCompletionTestCase(
        name="convert_annual_income_to_float_comment",
        test_case_core=CONVERT_ANNUAL_INCOME_TO_FLOAT,
        prefix=""""# Convert the annual income column to float""",
        suffix="",
        type_tags=['comment_following'],
    ),

    InlineCodeCompletionTestCase(
        name="convert_annual_income_to_float_no_comment",
        test_case_core=CONVERT_ANNUAL_INCOME_TO_FLOAT,
        prefix=""""loans_df['annual_income'] = loans_df['annual_income'].astype(fl""",
        suffix="",
        type_tags=['no_expressed_intent'],
    ),

    # Convert interest rate to int
    InlineCodeCompletionTestCase(
        name="convert_interest_rate_to_int_comment",
        test_case_core=CONVERT_INTEREST_RATE_TO_INT,
        prefix=""""# Convert the interest rate column to int""",
        suffix="",
        type_tags=['comment_following'],
    ),

    # Convert interest rate to int -- no comment
    InlineCodeCompletionTestCase(
        name="convert_km_to_float_3/3_lines_provided_no_comment",
        test_case_core=CONVERT_INTEREST_RATE_TO_INT,
        prefix="""used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)""",
        suffix="",
        type_tags=['no_expressed_intent'],
    ),

    # Convert interest rate to int -- no comment
    InlineCodeCompletionTestCase(
        name="convert_km_to_float_3/3_lines_provided_with_comment",
        test_case_core=CONVERT_INTEREST_RATE_TO_INT,
        prefix=""" # Convert the kilometers driven column to float
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].str[:-3]
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].replace({',': ''}, regex=True)
used_cars_df["kmDriven"] = used_cars_df["kmDriven"].astype(float)""",
        suffix="",
        type_tags=['no_expressed_intent'],
    ),

    # Convert kilometers driven to float
    # 2/3 lines provided as prefix
    InlineCodeCompletionTestCase(
        name="convert_km_to_float_no_comment_2/3_lines_provided",
        test_case_core=CONVERT_KILOMETERS_DRIVEN_TO_FLOAT,
        prefix=""""used_cars_df['kmDriven'] = used_cars_df['kmDriven'].str[:-3]
used_cars_df['kmDriven'] = used_cars_df['kmDriven'].replace({',': ''}, regex=True)
""",
        suffix="",
        type_tags=['no_expressed_intent'],
    ),

    # Convert kilometers driven to float
    # 1/3 lines provided as prefix
    InlineCodeCompletionTestCase(
        name="convert_km_to_float_no_comment_1/3_lines_provided",
        test_case_core=CONVERT_KILOMETERS_DRIVEN_TO_FLOAT,
        prefix=""""used_cars_df['kmDriven'] = used_cars_df['kmDriven'].str[:-3]
""",
        suffix="",
        type_tags=['no_expressed_intent'],
    ),

    # Convert kilometers driven to float
    InlineCodeCompletionTestCase(
        name="convert_km_to_float_comment_0/3_lines_provided",
        test_case_core=CONVERT_KILOMETERS_DRIVEN_TO_FLOAT,
        prefix=""""# Convert the kilometers driven column to float""",
        suffix="",
        type_tags=['comment_following'],
    ),

    # Replace underscore with space in column names
    InlineCodeCompletionTestCase(
        name="replace_underscore_with_space_in_column_names_comment",
        test_case_core=REPLACE_UNDERSCORE_WITH_SPACE_IN_COLUMN_NAMES,
        prefix=""""# Replace the underscore with a space in the column names""",
        suffix="",
        type_tags=['comment_following'],
    ),

    # Replace underscore with space in column names
    InlineCodeCompletionTestCase(
        name="replace_underscore_with_space_in_column_names",
        test_case_core=REPLACE_UNDERSCORE_WITH_SPACE_IN_COLUMN_NAMES,
        prefix=""""loans_df.columns = [col.replace('_', ' ') if isinstance(col, str) else""",
        suffix="",
        type_tags=['code_completion'],
    ),


]
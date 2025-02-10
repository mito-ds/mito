from evals.eval_types import NotebookState, SmartDebugTestCase

MISC_TESTS = [
    SmartDebugTestCase(
        name="aaron",
        notebook_state=NotebookState(
            global_vars={},
            cell_contents=[
"""
import pandas as pd
revenue_multiplier =  1.5
sales_df = pd.DataFrame({
        'transaction_date': ['2024-01-02', '2024-01-02', '2024-01-02', '2024-01-02', '2024-01-03'],
        'price_per_unit': [10, 9.99, 13.99, 21.00, 100],
        'units_sold': [1, 2, 1, 4, 5],
        'total_price': [10, 19.98, 13.99, 84.00, 500]
})
"""
            ]
        ),
        invalid_code="sales_df['total_revenue'] = sales_df['price'] * revenue_multiplier",
        correct_code="sales_df['total_revenue'] = sales_df['total_price'] * revenue_multiplier'",
        workflow_tags=['simple'],
        type_tags=['SyntaxError']
    ),
]
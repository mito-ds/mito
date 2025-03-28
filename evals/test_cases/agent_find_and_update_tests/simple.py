# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from dataclasses import dataclass
from typing import List, Literal    
from evals.eval_types import AgentFindAndUpdateTestCase, Cell, CellUpdate
from evals.test_cases.agent_find_and_update_tests.utils import get_cells_from_ipynb_in_notebook_folder

SIMPLE_TESTS = [
    
    # Very Simple Test with only one code cell
    AgentFindAndUpdateTestCase(
        name='first test',
        initial_notebook_state=[
            Cell(
                cell_type='code',
                id="9e38c62b-38f8-457d-bb8d-28bfc52edf2c",
                code="""x=10
y=30
z = x + y""" 
            )
        ],
        user_input="Update x to 50",
        cell_update=CellUpdate(
            id="9e38c62b-38f8-457d-bb8d-28bfc52edf2c",
            code="""x=50
y=30
z = x + y"""
        ),
        workflow_tags = ['agent'],
        type_tags = ['short']
    ),
    
    
    # Rename a variable in a notebook with 5 code cells
    AgentFindAndUpdateTestCase(
        name='warren_buffet_column_rename',
        initial_notebook_state=get_cells_from_ipynb_in_notebook_folder('WarrenBuffet-Short.ipynb'),
        user_input="Instead of calling the column YEAR-MONTH, let's just call it `date_short`",
        cell_update=CellUpdate(
            id="c68fdf19-db8c-46dd-926f-d90ad35bb3bc",
            code="""from mitosheet.public.v3 import *; 
import pandas as pd

warren_buffett_portfolio_copy = warren_buffett_portfolio.copy(deep=True)

# Added column 'YEAR-MONTH'
warren_buffett_portfolio_copy.insert(1, 'date_short', CONCAT(YEAR(warren_buffett_portfolio_copy['Date']), "-", MONTH( ENDOFBUSINESSMONTH(warren_buffett_portfolio_copy['Date']))))

# Dropped duplicates in warren_buffett_portfolio
warren_buffett_portfolio_copy = warren_buffett_portfolio_copy.drop_duplicates(subset=['date_short', 'Symbol'], keep='last')

# Filtered Date
warren_buffett_portfolio_copy = warren_buffett_portfolio_copy[warren_buffett_portfolio_copy['Date'] > pd.to_datetime('2018-02-25')]
"""
        ),
        workflow_tags = ['agent'],
        type_tags = ['short']
    ),
    
    # Update pivot table in a notebook with 5 code cells
    # With a specific instruction to remove a specific aggregation
    # function from the construction of the pivot table
    AgentFindAndUpdateTestCase(
        name='warren_buffet_column_pivot_table_configuration_specific_intent',
        initial_notebook_state=get_cells_from_ipynb_in_notebook_folder('WarrenBuffet-Short.ipynb'),
        user_input="Don't include the median aggregation in the pivot table. Since we are only using one aggregation, use the format = mean, instead of = [mean]",
        cell_update=CellUpdate(
            id="be7d0a75-32a4-4812-a45d-a828aee90958",
            code="""from mitosheet.public.v3 import *; 
import plotly.express as px

# Pivoted warren_buffett_portfolio into warren_buffett_portfolio_pivot
tmp_df = warren_buffett_portfolio[['Industry', 'Num_Employees']].copy()
pivot_table = tmp_df.pivot_table(
    index=['Industry'],
    values=['Num_Employees'],
    aggfunc={'Num_Employees': 'mean'}
)
pivot_table = pivot_table.set_axis([flatten_column_header(col) for col in pivot_table.keys()], axis=1)
warren_buffett_portfolio_pivot = pivot_table.reset_index()"""
        ),
        workflow_tags = ['agent'],
        type_tags = ['short']
    ),
    
    # Update pivot table in a notebook with 5 code cells
    # With less specific intent: Just tell it to remove columns that are not used
    AgentFindAndUpdateTestCase(
        name='warren_buffet_column_pivot_table_configuration_less_specific_intent',
        initial_notebook_state=get_cells_from_ipynb_in_notebook_folder('WarrenBuffet-Short.ipynb'),
        user_input="Don't create any aggregated columns in the pivot table that are not used later. If we are now only using one aggregation, use the format = mean, instead of = [mean]",
        cell_update=CellUpdate(
            id="be7d0a75-32a4-4812-a45d-a828aee90958",
            code="""from mitosheet.public.v3 import *; 
import plotly.express as px

# Pivoted warren_buffett_portfolio into warren_buffett_portfolio_pivot
tmp_df = warren_buffett_portfolio[['Industry', 'Num_Employees']].copy()
pivot_table = tmp_df.pivot_table(
    index=['Industry'],
    values=['Num_Employees'],
    aggfunc={'Num_Employees': 'mean'}
)
pivot_table = pivot_table.set_axis([flatten_column_header(col) for col in pivot_table.keys()], axis=1)
warren_buffett_portfolio_pivot = pivot_table.reset_index()"""
        ),
        workflow_tags = ['agent'],
        type_tags = ['short']
    ),
    
    
    # Update a filter in the MEDIUM size analysis
    AgentFindAndUpdateTestCase(
        name='warren_buffet_medium_filter_update',
        initial_notebook_state=get_cells_from_ipynb_in_notebook_folder('WarrenBuffet-Medium.ipynb'),
        user_input="Update the filter from 2018 to 2019",
        cell_update=CellUpdate(
            id="c68fdf19-db8c-46dd-926f-d90ad35bb3bc",
            code="""warren_buffett_portfolio_copy = warren_buffett_portfolio.copy(deep=True)

# Added column 'YEAR-MONTH'
warren_buffett_portfolio_copy.insert(1, 'YEAR-MONTH', CONCAT(YEAR(warren_buffett_portfolio_copy['Date']), "-", MONTH( ENDOFBUSINESSMONTH(warren_buffett_portfolio_copy['Date']))))

# Dropped duplicates in warren_buffett_portfolio
warren_buffett_portfolio_copy = warren_buffett_portfolio_copy.drop_duplicates(subset=['YEAR-MONTH', 'Symbol'], keep='last')

# Filtered Date
warren_buffett_portfolio_copy = warren_buffett_portfolio_copy[warren_buffett_portfolio_copy['Date'] > pd.to_datetime('2019-02-25')]
"""
        ),
        workflow_tags = ['agent'],
        type_tags = ['medium']
    ),
    
    # Update a filter in the LONG size analysis
    AgentFindAndUpdateTestCase(
        name='warren_buffet_long_filter_update',
        initial_notebook_state=get_cells_from_ipynb_in_notebook_folder('WarrenBuffet-Long.ipynb'),
        user_input="Update the filter from 2018 to 2019",
        cell_update=CellUpdate(
            id="c68fdf19-db8c-46dd-926f-d90ad35bb3bc",
            code="""warren_buffett_portfolio_copy = warren_buffett_portfolio.copy(deep=True)

# Added column 'YEAR-MONTH'
warren_buffett_portfolio_copy.insert(1, 'YEAR-MONTH', CONCAT(YEAR(warren_buffett_portfolio_copy['Date']), "-", MONTH( ENDOFBUSINESSMONTH(warren_buffett_portfolio_copy['Date']))))

# Dropped duplicates in warren_buffett_portfolio
warren_buffett_portfolio_copy = warren_buffett_portfolio_copy.drop_duplicates(subset=['YEAR-MONTH', 'Symbol'], keep='last')

# Filtered Date
warren_buffett_portfolio_copy = warren_buffett_portfolio_copy[warren_buffett_portfolio_copy['Date'] > pd.to_datetime('2019-02-25')]
"""
        ),
        workflow_tags = ['agent'],
        type_tags = ['long']
    ),
    
    
    # Uncomment code in LONG notebook
    AgentFindAndUpdateTestCase(
        name='uncomment_code_in_second_cell_long_notebook',
        initial_notebook_state=get_cells_from_ipynb_in_notebook_folder('n1b_python_and_variables.ipynb'),
        user_input="Uncomment 'print('hello') so that we print both hello and world",
        cell_update=CellUpdate(
            id="212f7310",
            code="""print("hello")
print("world")
"""
        ),
        workflow_tags = ['agent'],
        type_tags = ['long']
    ),
    
    # Create new variable in LONG notebook
    AgentFindAndUpdateTestCase(
        name='create_new_variable_in_last_cell_long_notebook',
        initial_notebook_state=get_cells_from_ipynb_in_notebook_folder('n1b_python_and_variables.ipynb'),
        user_input="Create a new string s3 and set it equal to the value 'Third String'",
        cell_update=CellUpdate(
            id="f40f5996",
            code="""s1 = 'First String'
s2 = 'Second String'
s3 = 'Third String'
# TODO: Replace me with your code
"""
        ),
        workflow_tags = ['agent'],
        type_tags = ['long']
    ),
    
    # Update dictionary in LONG notebook
    AgentFindAndUpdateTestCase(
        name='remove_dict_entry_long_notebook',
        initial_notebook_state=get_cells_from_ipynb_in_notebook_folder('n1b_python_and_variables.ipynb'),
        user_input="Update the code where I create the dictionary `d` so that it does not include the entry 'shell'",
        cell_update=CellUpdate(
            id="b9224693",
            code="""d = {"sand": "tiny grains", "wave": "ocean's rhythm"}
d
"""
        ),
        workflow_tags = ['agent'],
        type_tags = ['long']
    ),
    
    
    # Update the suffix of a merge in a long notebook
    AgentFindAndUpdateTestCase(
        name='update_suffix_of_merge_long_notebook',
        initial_notebook_state=get_cells_from_ipynb_in_notebook_folder('2a-pandas-fundamental-transformations.ipynb'),
        user_input="Update the suffixes of the basic_recon from ` trading` and ` accounting` to `_TRADING_DATA` and `_ACCOUNTING_DATA`",
        cell_update=CellUpdate(
            id='c004e660-815e-4b82-9e50-528d75f195c9',
            code="""
basic_recon = pd.merge(trading_positions, accounting_positions, how='left', on='symbol', suffixes=('_TRADING_DATA', '_ACCOUNTING_DATA'))
basic_recon"""
        ),
        workflow_tags=['agent'],
        type_tags = ['long']
    )
    
    
]
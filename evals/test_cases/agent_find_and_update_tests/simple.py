
from dataclasses import dataclass
from typing import List, Literal    
from evals.eval_types import AgentFindAndUpdateTestCase, Cell, CellUpdate
from evals.test_cases.agent_find_and_update_tests.utils import get_cells_from_ipynb_in_notebook_folder

SIMPLE_TESTS = [
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
        type_tags = ['simple']
    ),
    
    
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
        type_tags = ['simple']
    ),
]
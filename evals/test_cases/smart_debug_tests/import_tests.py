from evals.eval_types import SmartDebugTestCase
from evals.notebook_states import EMPTY_NOTEBOOK


IMPORT_TESTS = [
    SmartDebugTestCase(
        name="missing_datetime_import_simple",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
today = datetime.today().strftime('%Y-%m-%d')
""",
        correct_code="""
from datetime import datetime
today = datetime.today().strftime('%Y-%m-%d')
""",
        workflow_tags=['simple', 'import'],
        type_tags=['NameError']
    ),
    SmartDebugTestCase(
        name="missing_pandas_import_simple",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
""",
        correct_code="""
import pandas as pd
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
""",
        workflow_tags=['simple', 'import'],
        type_tags=['NameError']
    ),
    SmartDebugTestCase(
        name="import_as_typo",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
import pandas as ps
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
""",
        correct_code="""
import pandas as pd
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
""",
        workflow_tags=['import', 'typo'],
        type_tags=['NameError']
    ),
    SmartDebugTestCase(
        name="missing_multiple_imports_1",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
def _generate_sample_data(days: int = 90) -> pd.DataFrame:
        # Generate sample sales data with potential error triggers.
        np.random.seed(42)
        dates = [datetime.now() - timedelta(days=x) for x in range(days)]
        products = ['A', 'B', 'C', 'D', None]  # None to trigger errors
        
        data = []
        for date in dates:
            for _ in range(np.random.randint(5, 15)):
                row = {
                    'date': date,
                    'product': np.random.choice(products),
                    'revenue': np.random.uniform(-100, 1000),  # Negative values to trigger errors
                    'quantity': np.random.randint(0, 50),
                    'customer_id': np.random.randint(1, 1000),
                    'region': np.random.choice(['North', 'South', 'East', 'West', None])
                }
                data.append(row)
        
        return pd.DataFrame(data)
""",
        correct_code="""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
def _generate_sample_data(days: int = 90) -> pd.DataFrame:
        # Generate sample sales data with potential error triggers.
        np.random.seed(42)
        dates = [datetime.now() - timedelta(days=x) for x in range(days)]
        products = ['A', 'B', 'C', 'D', None]  # None to trigger errors
        
        data = []
        for date in dates:
            for _ in range(np.random.randint(5, 15)):
                row = {
                    'date': date,
                    'product': np.random.choice(products),
                    'revenue': np.random.uniform(-100, 1000),  # Negative values to trigger errors
                    'quantity': np.random.randint(0, 50),
                    'customer_id': np.random.randint(1, 1000),
                    'region': np.random.choice(['North', 'South', 'East', 'West', None])
                }
                data.append(row)
        
        return pd.DataFrame(data)
""",
        workflow_tags=['import'],
        type_tags=['NameError']
    ),
    SmartDebugTestCase(
        name="missing_multiple_imports_2",
        notebook_state=EMPTY_NOTEBOOK,
        invalid_code="""
def generate_fake_dataset(rows: int = 100) -> pd.DataFrame:
        # Generate sample sales data with potential error triggers.
        np.random.seed(42)
        
        # Generate 100 rows of fake data
        dates = [datetime.now() - timedelta(days=x) for x in range(rows)]
        price = np.random.uniform(10, 100, rows)
        quantity = np.random.randint(1, 10, rows)
        customer_id = np.random.randint(1, 1000, rows)
        region = np.random.choice(['North', 'South', 'East', 'West', None], rows)

        df = pd.DataFrame({
            'date': dates,
            'price': price,
            'quantity': quantity,
            'customer_id': customer_id,
            'region': region
        })
        
        return df
""",
        correct_code="""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
def generate_fake_dataset(rows: int = 100) -> pd.DataFrame:
        # Generate sample sales data with potential error triggers.
        np.random.seed(42)
        
        # Generate 100 rows of fake data
        dates = [datetime.now() - timedelta(days=x) for x in range(rows)]
        price = np.random.uniform(10, 100, rows)
        quantity = np.random.randint(1, 10, rows)
        customer_id = np.random.randint(1, 1000, rows)
        region = np.random.choice(['North', 'South', 'East', 'West', None], rows)

        df = pd.DataFrame({
            'date': dates,
            'price': price,
            'quantity': quantity,
            'customer_id': customer_id,
            'region': region
        })
        
        return df
""",
        workflow_tags=['import'],
        type_tags=['NameError']
    )
]


from evals.eval_types import DebugPromptGenerator, NotebookState

__all__ = ["prod_prompt_v3_generator"]

class _ProdPromptV3Generator(DebugPromptGenerator):
    prompt_name = "prod_prompt_v3"


    def get_prompt(self, error_message: str, notebook_state: NotebookState) -> str:
        
        # Get the error messag
        print(f"Error message HERE: {error_message}")
        return f"""You are debugging code in a JupyterLab 4 notebook. Analyze the error and provide a solution that maintains the original intent.

<Example 1>
Defined Variables:
{{
    'revenue_multiplier': 1.5,
    'sales_df': pd.DataFrame({{
        'transaction_date': ['2024-01-02', '2024-01-02', '2024-01-02', '2024-01-02', '2024-01-03'],
        'price_per_unit': [10, 9.99, 13.99, 21.00, 100],
        'units_sold': [1, 2, 1, 4, 5],
        'total_price': [10, 19.98, 13.99, 84.00, 500]
    }})
}}

Code in active cell:
```python
sales_df['total_revenue'] = sales_df['price'] * revenue_multiplier
```

Error Traceback:
---------------------------------------------------------------------------
KeyError                                  Traceback (most recent call last)
File ~/Mito/mito/mito-ai/venv/lib/python3.11/site-packages/pandas/core/indexes/base.py:3805, in Index.get_loc(self, key)
   3804 try:
-> 3805     return self._engine.get_loc(casted_key)
   3806 except KeyError as err:

File index.pyx:167, in pandas._libs.index.IndexEngine.get_loc()

File index.pyx:196, in pandas._libs.index.IndexEngine.get_loc()

File pandas/_libs/hashtable_class_helper.pxi:7081, in pandas._libs.hashtable.PyObjectHashTable.get_item()

File pandas/_libs/hashtable_class_helper.pxi:7089, in pandas._libs.hashtable.PyObjectHashTable.get_item()

KeyError: 'price'

The above exception was the direct cause of the following exception:

KeyError                                  Traceback (most recent call last)
Cell In[24], line 9
      2 revenue_multiplier =  1.5
      3 sales_df = pd.DataFrame({{
      4         'transaction_date': ['2024-01-02', '2024-01-02', '2024-01-02', '2024-01-02', '2024-01-03'],
      5         'price_per_unit': [10, 9.99, 13.99, 21.00, 100],
      6         'units_sold': [1, 2, 1, 4, 5],
      7         'total_price': [10, 19.98, 13.99, 84.00, 500]
      8 }})
----> 9 sales_df['total_revenue'] = sales_df['price'] * revenue_multiplier

File ~/Mito/mito/mito-ai/venv/lib/python3.11/site-packages/pandas/core/frame.py:4102, in DataFrame.__getitem__(self, key)
   4100 if self.columns.nlevels > 1:
   4101     return self._getitem_multilevel(key)
-> 4102 indexer = self.columns.get_loc(key)
   4103 if is_integer(indexer):
   4104     indexer = [indexer]

File ~/Mito/mito/mito-ai/venv/lib/python3.11/site-packages/pandas/core/indexes/base.py:3812, in Index.get_loc(self, key)
   3807     if isinstance(casted_key, slice) or (
   3808         isinstance(casted_key, abc.Iterable)
   3809         and any(isinstance(x, slice) for x in casted_key)
   3810     ):
   3811         raise InvalidIndexError(key)
-> 3812     raise KeyError(key) from err
   3813 except TypeError:
   3814     # If we have a listlike key, _check_indexing_error will raise
   3815     #  InvalidIndexError. Otherwise we fall through and re-raise
   3816     #  the TypeError.
   3817     self._check_indexing_error(key)

KeyError: 'price'


ERROR ANALYSIS:
Runtime error: Attempted to access non-existent DataFrame column

INTENT ANALYSIS:
User is trying to calculate total revenue by applying a multiplier to transaction prices. Based on the defined variables, the column that the user is tring to access is likely `total_price` because that would allow them to calculate the total revenue for each transaction.

SOLUTION:
```python
sales_df['total_revenue'] = sales_df['total_price'] * revenue_multiplier
```

The DataFrame contains 'total_price' rather than 'price'. Updated column reference to match existing data structure.
</Example 1>

<Example 2>
Defined Variables:
{{
    'df': pd.DataFrame({{
        'order_id': [1, 2, 3, 4],
        'date': ['Mar 7, 2025', 'Sep 24, 2024', '25 June, 2024', 'June 29, 2024'],
        'amount': [100, 150, 299, 99]
    }})
}}

Code in active cell:
```python
df['date'] = pd.to_datetime(df['date'])
```

Error Traceback:
---------------------------------------------------------------------------
ValueError                                Traceback (most recent call last)
Cell In[27], line 1
----> 1 df['date'] = pd.to_datetime(df['date'])

File ~/Mito/mito/mito-ai/venv/lib/python3.11/site-packages/pandas/core/tools/datetimes.py:1067, in to_datetime(arg, errors, dayfirst, yearfirst, utc, format, exact, unit, infer_datetime_format, origin, cache)
   1065         result = arg.map(cache_array)
   1066     else:
-> 1067         values = convert_listlike(arg._values, format)
   1068         result = arg._constructor(values, index=arg.index, name=arg.name)
   1069 elif isinstance(arg, (ABCDataFrame, abc.MutableMapping)):

File ~/Mito/mito/mito-ai/venv/lib/python3.11/site-packages/pandas/core/tools/datetimes.py:433, in _convert_listlike_datetimes(arg, format, name, utc, unit, errors, dayfirst, yearfirst, exact)
    431 # `format` could be inferred, or user didn't ask for mixed-format parsing.
    432 if format is not None and format != "mixed":
--> 433     return _array_strptime_with_fallback(arg, name, utc, format, exact, errors)
    435 result, tz_parsed = objects_to_datetime64(
    436     arg,
    437     dayfirst=dayfirst,
   (...)
    441     allow_object=True,
    442 )
    444 if tz_parsed is not None:
    445     # We can take a shortcut since the datetime64 numpy array
    446     # is in UTC

File ~/Mito/mito/mito-ai/venv/lib/python3.11/site-packages/pandas/core/tools/datetimes.py:467, in _array_strptime_with_fallback(arg, name, utc, fmt, exact, errors)
    456 def _array_strptime_with_fallback(
    457     arg,
    458     name,
   (...)
    462     errors: str,
    463 ) -> Index:
    464     \"\"\"
    465     Call array_strptime, with fallback behavior depending on 'errors'.
    466     \"\"\"
--> 467     result, tz_out = array_strptime(arg, fmt, exact=exact, errors=errors, utc=utc)
    468     if tz_out is not None:
    469         unit = np.datetime_data(result.dtype)[0]

File strptime.pyx:501, in pandas._libs.tslibs.strptime.array_strptime()

File strptime.pyx:451, in pandas._libs.tslibs.strptime.array_strptime()

File strptime.pyx:583, in pandas._libs.tslibs.strptime._parse_with_format()

ValueError: time data "25 June, 2024" doesn't match format "%b %d, %Y", at position 2. You might want to try:
    - passing `format` if your strings have a consistent format;
    - passing `format='ISO8601'` if your strings are all ISO8601 but not necessarily in exactly the same format;
    - passing `format='mixed'`, and the format will be inferred for each element individually. You might want to use `dayfirst` alongside this.

ERROR ANALYSIS:
This is a ValueError caused by applying the wrong format to a specific date string. Because it was triggered at position 2, the first date string must have successfully converted. By looking at the defined variables, I can see that first date string is in the format "Mar 7, 2025", but the third date string is in the format "25 June, 2024". Those dates are not in the same format, so the conversion failed.

INTENT ANALYSIS:
User is trying to convert the date column to a datetime object even though the dates are not in the same starting format. 

SOLUTION:
```python
def parse_date(date_str):
    formats = ['%b %d, %Y', '%d %B, %Y']
    
    for fmt in formats:
        try:
            return pd.to_datetime(date_str, format=fmt)
        except ValueError:
            # Try the next format
            continue
            
    # If no format worked, return Not a Time
    return pd.NaT

df['date'] = df['date'].apply(lambda x: parse_date(x))
```

Since the dates are not in a consistent format, we need to first figure out which format to use for each date string and then use that format to convert the date.

The best way to do this is with a function. We can call this function `parse_date`.
</Example 2>


Guidelines for Solutions:

Error Analysis:

- Identify error type (Syntax, Runtime, Logic).
- Use the defined variables and code in the active cell to understand the error.
- Consider kernel state and execution order

Intent Preservation:

- Try to understand the user's intent using the defined variables and code in the active cell.

Solution Requirements:

- Return the full code cell with the error fixed and a short explanation of the error.
- Propose a solution that fixes the error and does not change the user's intent.
- Make the solution as simple as possible.
- Reuse as much of the existing code as possible.
- Do not add temporary comments like '# Fixed the typo here' or '# Added this line to fix the error'
- The code in the SOLUTION section should be a python code block starting with ```python and ending with ```

Here is your task. 

Defined Variables:
{notebook_state.global_vars}

Code in active cell:
```python
{notebook_state.cell_contents[-1] if len(notebook_state.cell_contents) > 0 else ""}
```

Error Traceback:
{error_message}

ERROR ANALYSIS:

INTENT ANALYSIS:

SOLUTION:
"""

prod_prompt_v3_generator = _ProdPromptV3Generator()
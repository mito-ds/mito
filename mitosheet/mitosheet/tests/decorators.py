"""
Useful decorators for tests.
"""

import pytest
import pandas as pd


pandas_pre_1_only = pytest.mark.skipif(
    pd.__version__.startswith('0.'), 
    reason='This test only runs on earlier versions of Pandas. API inconsistencies make it fail on earlier versions'
)

pandas_post_1_only = pytest.mark.skipif(
    pd.__version__.startswith('1.'), 
    reason='This test only runs on later versions of Pandas. API inconsistencies make it fail on earlier versions'
)

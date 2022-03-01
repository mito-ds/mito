#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Useful decorators for tests. Specifically, we often only want
to run specific tests on specific versions of pandas or Python
"""

import pytest
import pandas as pd
import sys

from mitosheet.saved_analyses.schema_utils import is_prev_version


pandas_pre_1_only = pytest.mark.skipif(
    pd.__version__.startswith('1.'), 
    reason='This test only runs on earlier versions of Pandas. API inconsistencies make it fail on earlier versions'
)

pandas_post_1_only = pytest.mark.skipif(
    pd.__version__.startswith('0.'), 
    reason='This test only runs on later versions of Pandas. API inconsistencies make it fail on earlier versions'
)

pandas_post_1_2_only = pytest.mark.skipif(
    is_prev_version(pd.__version__, '1.2.0'), 
    reason='This test only runs on later versions of Pandas. API inconsistencies make it fail on earlier versions'
)

pandas_pre_1_2_only = pytest.mark.skipif(
    not is_prev_version(pd.__version__, '1.2.0'), 
    reason='This test only runs on later versions of Pandas. API inconsistencies make it fail on earlier versions'
)

python_post_3_6_only = pytest.mark.skipif(
    sys.version_info.minor <= 6, 
    reason="requires 3.7 or greater"
)


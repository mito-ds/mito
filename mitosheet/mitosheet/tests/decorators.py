#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
"""
Useful decorators for tests. Specifically, we often only want
to run specific tests on specific versions of pandas or Python
"""

import os
import pytest
import pandas as pd
import sys
from mitosheet.ai.ai_utils import is_open_ai_credentials_available

from mitosheet.utils import is_flask_installed, is_prev_version, is_snowflake_connector_python_installed, is_snowflake_credentials_available, is_streamlit_installed, is_dash_installed

pandas_pre_1_only = pytest.mark.skipif(
    not pd.__version__.startswith('0.'), 
    reason='This test only runs on earlier versions of Pandas. API inconsistencies make it fail on earlier versions'
)

pandas_pre_2_only = pytest.mark.skipif(
    pd.__version__.startswith('2.'), 
    reason='This test only runs on earlier versions of Pandas. API inconsistencies make it fail on earlier versions'
)

pandas_post_0_24_0_only = pytest.mark.skipif(
    is_prev_version(pd.__version__, '0.24.0'), 
    reason='This test only runs on later versions of Pandas. API inconsistencies make it fail on earlier versions'
)

pandas_post_1_only = pytest.mark.skipif(
    pd.__version__.startswith('0.'), 
    reason='This test only runs on later versions of Pandas. API inconsistencies make it fail on earlier versions'
)

pandas_post_1_2_only = pytest.mark.skipif(
    is_prev_version(pd.__version__, '1.2.0'), 
    reason='This test only runs on later versions of Pandas. API inconsistencies make it fail on earlier versions'
)

pandas_post_1_4_only = pytest.mark.skipif(
    is_prev_version(pd.__version__, '1.4.0'), 
    reason='This test only runs on later versions of Pandas. API inconsistencies make it fail on earlier versions'
)

pandas_post_1_5_only = pytest.mark.skipif(
    is_prev_version(pd.__version__, '1.5.0'), 
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

requires_snowflake_dependencies_and_credentials = pytest.mark.skipif(
    not is_snowflake_connector_python_installed() or not is_snowflake_credentials_available(),
    reason='requires snowflake_connector_python package and snowflake credentials'
)

requires_streamlit = pytest.mark.skipif(
    not is_streamlit_installed(),
    reason='requires streamlit to be installed'
)

requires_flask = pytest.mark.skipif(
    not is_flask_installed(),
    reason='requires flask to be installed'
)

requires_dash = pytest.mark.skipif(
    not is_dash_installed(),
    reason='requires dash to be installed'
)

requires_open_ai_credentials = pytest.mark.skipif(
    not is_open_ai_credentials_available(),
    reason='Requires a set OPENAI_API_KEY'
)

only_on_github_actions = pytest.mark.skipif(
    'GITHUB_ACTIONS' not in os.environ,
    reason='This test only runs on GitHub Actions'
)
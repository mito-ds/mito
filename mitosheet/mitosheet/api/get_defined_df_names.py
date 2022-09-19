#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict
import pandas as pd
from mitosheet.types import StepsManagerType


def get_df_names() -> Dict[str, pd.DataFrame]:
    from IPython import get_ipython
    from io import StringIO 
    import sys

    ipython = get_ipython()

    class Capturing(list):
        def __enter__(self):
            self._stdout = sys.stdout
            sys.stdout = self._stringio = StringIO()
            return self
        def __exit__(self, *args):
            self.extend(self._stringio.getvalue().splitlines())
            del self._stringio    # free up some memory
            sys.stdout = self._stdout

    with Capturing() as output:
        ipython.run_line_magic("who",  "DataFrame")
        
    output = [df.strip() for line in output for df in line.split("\t") if df.strip() != '']
    return output


def get_defined_df_names(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    

    return json.dumps({
        	'df_names': get_df_names(),
    })

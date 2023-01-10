#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from typing import Any, Dict
import pandas as pd
from mitosheet.types import StepsManagerType


NO_DEFINED_DF_MESSAGE = 'No variables match your requested type.'

def get_df_names() -> Dict[str, pd.DataFrame]:
    from IPython import get_ipython
    from io import StringIO 
    import sys

    ipython = get_ipython() # type: ignore

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
    
    # If we get a message there are no variables, clear this out of the ouput
    if len(output) == 1 and output[0] == NO_DEFINED_DF_MESSAGE:
        output = []

    return output


def get_defined_df_names(params: Dict[str, Any], steps_manager: StepsManagerType) -> str:
    return json.dumps(get_df_names())

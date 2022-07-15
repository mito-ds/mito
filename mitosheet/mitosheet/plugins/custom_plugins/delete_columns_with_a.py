

from typing import Dict, List

import pandas as pd
from mitosheet.plugins.plugin import Plugin
from mitosheet.transpiler.transpile_utils import column_header_list_to_transpiled_code


class DeleteColumnsWithAPlugin(Plugin):

    @classmethod
    def get_plugin_name(cls) -> str:
        return 'Delete Column with A'

    @classmethod
    def creates_new_dataframe(cls) -> str:
        return False

    def transform(self) -> pd.DataFrame:
        return self.df.drop([column for column in self.df.columns if 'A' in str(column)], axis=1)
        
    def get_code(self) -> List[str]:
        return [f'{self.df_name}.drop({column_header_list_to_transpiled_code([column for column in self.df.columns if "A" in str(column)])}, axis=1)']


from typing import Dict, List

import pandas as pd
from mitosheet.plugins.plugin import Plugin


class DeleteIDColumnPlugin(Plugin):

    @classmethod
    def get_plugin_name(cls) -> str:
        return 'Delete ID Column'

    def transform(self) -> pd.DataFrame:
        return self.df.drop(['id'], axis=1)
        
    def get_code(self) -> List[str]:
        return [f'{self.df_name}.drop(["id"], axis=1)']
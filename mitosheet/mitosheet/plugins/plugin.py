


from typing import Dict, List
import pandas as pd


class Plugin:

    def __init__(self, df: pd.DataFrame, df_name: str):
        self.df = df
        self.df_name = df_name

    @classmethod
    def get_plugin_name(cls) -> str:
        raise NotImplementedError("TODO: add the name of the plugin")

    @classmethod
    def creates_new_dataframe(cls) -> bool:
        """Override to return false to overwrite the current dataframe"""
        return True

    @classmethod
    def get_param_specification(cls) -> Dict[str, Dict[str, str]]:
        # NOTE: No additional params
        return {}

    def transform(self) -> pd.DataFrame:
        # TODO: how to add params
        raise NotImplementedError("Implement the transform method")

    def get_code(self) -> List[str]:
        raise NotImplementedError("Implement the get_code method")




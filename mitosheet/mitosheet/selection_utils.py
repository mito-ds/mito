from typing import List, Union,Optional

import pandas as pd

from mitosheet.types import MitoFrontendIndexAndSelections


def get_selected_element(dfs: List[pd.DataFrame], indexAndSelections: Optional[MitoFrontendIndexAndSelections]) -> Union[pd.DataFrame, pd.Series, None]:

    if indexAndSelections is None:
        return None

    selected_dataframe_index = indexAndSelections['selectedDataframeIndex']
    if selected_dataframe_index < 0 or selected_dataframe_index >= len(dfs):
        return None
    
    df = dfs[selected_dataframe_index]

    # If there are multiple selections, for now we only return the first one - for simplicity in return types
    selection = next(iter(indexAndSelections['selections']))

    # Selections have the format: {'startingRowIndex': 0, 'endingRowIndex': 0, 'startingColumnIndex': 5, 'endingColumnIndex': 5}

    smallerRowIndex = min(selection['startingRowIndex'], selection['endingRowIndex'])
    largerRowIndex = max(selection['startingRowIndex'], selection['endingRowIndex'])
    smallerColumnIndex = min(selection['startingColumnIndex'], selection['endingColumnIndex'])
    largerColumnIndex = max(selection['startingColumnIndex'], selection['endingColumnIndex'])

    # If the row indexes selected are both -1, we just return the column
    if smallerRowIndex == -1 and largerRowIndex == -1:
        return df.iloc[:, smallerColumnIndex:largerColumnIndex + 1]
    
    # If the column indexes selected are both -1, we just return the row
    if smallerColumnIndex == -1 and largerColumnIndex == -1:
        return df.iloc[smallerRowIndex:largerRowIndex + 1, :]
    
    # If one row index is -1, then we return the column
    if smallerRowIndex == -1:
        return df.iloc[:, smallerColumnIndex:largerColumnIndex + 1]
    
    # If one column index is -1, then we return the row
    if smallerColumnIndex == -1:
        return df.iloc[smallerRowIndex:largerRowIndex + 1, :]
    
    # Otherwise, we return the intersection of the row and column
    return df.iloc[smallerRowIndex:largerRowIndex + 1, smallerColumnIndex:largerColumnIndex + 1]
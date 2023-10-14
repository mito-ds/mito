"""
Mito aims to provide incredibly easy extension points. For now, Mito allows you to 
type a function variable with a ColumnHeader, and this will generate a UI for selecting
a column from the nearest preceding dataframe.
"""
from typing import Any
## Extension Types We Support 

# NOTE: the other approach here would be making ColumnHeader parameteric on the name of the dataframe
# arg. This would allow us to support multiple dataframes in a single function with potentially more 
# flexibility, but it feels needlessly complicated for now.
ColumnHeader = Any
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.

import json
from copy import deepcopy
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.state import State
from mitosheet.step_performers.bulk_old_rename.deprecated_utils import \
    get_header_renames
from mitosheet.step_performers.column_steps.rename_column import \
    rename_column_headers_in_state
from mitosheet.step_performers.step_performer import StepPerformer


class BulkOldRenameStepPerformer(StepPerformer):
    """
    This step just renames certain dataframes to have column
    headers that are renamed in the way we used to rename them.

    This makes it possible for us to upgrade to step versions
    that no longer do these renames, namely the preprocess step,
    simple import, and pivoting!
    """

    @classmethod
    def step_version(cls) -> int:
        # NOTE: we should _never_ change this step!
        return 1

    @classmethod
    def step_type(cls) -> str:
        return 'bulk_old_rename'

    @classmethod
    def step_display_name(cls) -> str:
        return 'Renamed Columns'
    
    @classmethod
    def step_event_type(cls) -> str:
        return 'old_rename_only_use_this_in_testing'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        return params

    @classmethod
    def execute( # type: ignore
        cls,
        prev_state: State,
        move_to_deprecated_id_algorithm: bool=False,
        **params: Any
    ) -> Tuple[State, Optional[Dict[str, Any]]]:
        """
        If move_to_deprecated_id_algorithm, then this step is being
        used at the start of a replayed analysis to stand in for
        the preprocessing step that used to exist. 

        Thus, in this case, we move _all_ ids from the new format to 
        the old format. This is pretty unplesant, but necessary to 
        make sure that users who pass dataframes into Mito directly
        do not have their analysis break when they upgrade.
        """

        post_state = prev_state.copy(deep_sheet_indexes=list(range(len(prev_state.dfs))))

        column_header_renames_list = []
        for sheet_index, df in enumerate(prev_state.dfs):
            column_headers = df.keys()
            column_header_renames = get_header_renames(column_headers)
            column_header_renames_list.append(column_header_renames)

            for old_column_header, new_column_header in column_header_renames.items():
                column_id = post_state.column_ids.get_column_id_by_header(sheet_index, old_column_header)
                rename_column_headers_in_state(
                    post_state,
                    sheet_index,
                    column_id,
                    new_column_header,
                    None
                )

        if move_to_deprecated_id_algorithm:
            post_state.move_to_deprecated_id_algorithm()
        
        return post_state, {
            'column_header_renames_list': column_header_renames_list
        }
        

    @classmethod
    def transpile( # type: ignore
        cls,
        prev_state: State,
        post_state: State,
        execution_data: Optional[Dict[str, Any]],
        **params
    ) -> List[str]:
        code = []
        for sheet_index, df_name in enumerate(post_state.df_names):
            renames = execution_data['column_header_renames_list'][sheet_index] if execution_data else {}
            if len(renames) == 0:
                continue

            code.append(
                f'{df_name}.rename(columns={json.dumps(renames)}, inplace=True)'
            )

        if len(code) > 0:
            code.insert(0, '# Rename headers to make them work with Mito')

        return code
        
    @classmethod
    def describe(
        cls,
        df_names: List[str]=None,
        **params: Any
    ) -> str:
        return f'Renamed headers for compatibility with previous Mito versions'

    @classmethod
    def get_modified_dataframe_indexes( # type: ignore
        cls, 
        **params
    ) -> Set[int]:
        return set() # changes all dataframes
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from abc import ABC, abstractmethod
from collections import Counter
from time import perf_counter
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.errors import make_column_exists_error
from mitosheet.state import State
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.transpiler.transpile_utils import get_globals_for_exec
from mitosheet.types import ExecuteThroughTranspileNewDataframeParams, ExecuteThroughTranspileNewColumnParams
 
class StepPerformer(ABC, object):
    """
    The abstract base class for a step performer, which are the set
    of classes that execute, transpile, and describe steps. 
    """

    @classmethod
    @abstractmethod
    def step_version(cls) -> int:
        """
        Returns the version of the step. Changes when the parameters
        of the step change.
        """
        pass

    @classmethod
    @abstractmethod
    def step_type(cls) -> str:
        """
        The name of the step used internally. If you change this, you must upgrade
        the step and bump the version.
        """
        pass
    
    @classmethod
    def step_event_type(cls) -> str:
        """
        The type of the edit event that generates this type of step. 
        This is always just f'{cls.step_type}_edit'.
        """
        return f'{cls.step_type()}_edit'

    @classmethod
    def saturate(cls, prev_state: State, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Given the parameters of the step, will saturate the event with
        more parameters based on the passed prev_state. 
        """
        # By default, we don't do anything with the saturate
        return params

    @classmethod
    @abstractmethod
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        """
        Execute always returns the post_state, and optionally returns a dictionary
        of execution_data, which is data that may be useful to the transpiler in
        transpiling the code.

        If the execution_data also includes the key `pandas_processing_time`, this 
        will allow the logging infrastructure to determine how much overhead Mito
        adds to executing this event.

        By default, this function will return the result of just executing the transpiled
        code. Note that this only works for functions that have no execution data they need.
        """
        post_state, execution_data = cls.execute_through_transpile(prev_state, params)
        return post_state, execution_data

    @classmethod
    @abstractmethod
    def transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]],
    ) -> List[CodeChunk]:
        """
        Returns a list of the CodeChunks that correspond to this 
        step being executed
        """
        pass

    @classmethod
    def execute_through_transpile(
        cls,
        prev_state: State,
        params: Dict[str, Any],
        execution_data: Optional[Dict[str, Any]]=None,
        new_dataframe_params: Optional[ExecuteThroughTranspileNewDataframeParams]=None,
        renamed_column_headers: bool=False,
        new_column_params: Optional[ExecuteThroughTranspileNewColumnParams]=None
    ) -> Tuple[State, Dict[str, Any]]:
        """
        Some steps can be executed through the transpiled code -- and in these cases, we can call this function
        so that we don't have to duplicate the work we do
        """
        if execution_data is None:
            execution_data = {}

        modified_dataframe_indexes = cls.get_modified_dataframe_indexes(params)
        # If the modified indexes are -1, then only new dataframes have been created -- and in this
        # case we just don't detect modifications
        if modified_dataframe_indexes == {-1}:
            modified_dataframe_indexes = set()

        post_state = prev_state.copy(deep_sheet_indexes=modified_dataframe_indexes)

        code_chunks = cls.transpile(post_state, params, execution_data)
        code = []
        for chunk in code_chunks:
            _code, imports = chunk.get_code()
            code.extend(imports)
            code.extend(_code)

        final_code = "\n".join(code)

        # NOTE; this is all wrong, but it's just b/c it's hard to get things out of exec. We do our best
        exec_globals = get_globals_for_exec(post_state, post_state.public_interface_version)
        exec_locals = {**exec_globals}
        
        pandas_start_time = perf_counter()
        exec(final_code, exec_globals, exec_locals)
        pandas_processing_time = perf_counter() - pandas_start_time


        for modified_dataframe_index in modified_dataframe_indexes:
            df_name = prev_state.df_names[modified_dataframe_index]
            new_df = exec_locals[df_name]
            old_df = prev_state.dfs[modified_dataframe_index]
            post_state.dfs[modified_dataframe_index] = new_df

            if renamed_column_headers:
                # If we renamed column headers, update them in the state
                for old_header, new_header in zip(old_df.columns, new_df.columns):
                    column_id = prev_state.column_ids.get_column_id_by_header(modified_dataframe_index, old_header)
                    post_state.column_ids.set_column_header(modified_dataframe_index, column_id, new_header)

            if len(new_df.columns) > len(old_df.columns):
                # Find all the new column headers, and add them to the state
                new_column_headers = [ch for ch in new_df.columns if ch not in old_df]
                post_state.add_columns_to_state(modified_dataframe_index, new_column_headers)

                # Check if there are any invalid column headers
                c = Counter(new_df.columns)
                most_common = c.most_common(1)
                print(most_common)
                for ch, count in most_common:
                    if count > 1:
                        raise make_column_exists_error(ch)

        if new_column_params:
            sheet_index = new_column_params['sheet_index']
            new_column_headers_to_column_id = new_column_params['new_column_headers_to_column_id']
            post_state.add_columns_to_state(sheet_index, list(new_column_headers_to_column_id.keys()), new_column_headers_to_column_id)

        if new_dataframe_params:
            sheet_indexes = new_dataframe_params['sheet_indexes'] 
            if sheet_indexes is None:
                sheet_indexes = {}

            for new_df_name in new_dataframe_params['new_df_names']:
                df_source = new_dataframe_params['df_source']
                sheet_index = sheet_indexes.get(new_df_name, None)

                new_df = exec_locals[new_df_name] # TODO: this is wrong. This will not always be updated, accoring to exec documentation
                post_state.add_df_to_state(new_df, df_name=new_df_name, df_source=df_source, sheet_index=sheet_index)

                print("NEW DF", new_df)


        return post_state, {
            'pandas_processing_time': pandas_processing_time,
            **execution_data
        }
        

    @classmethod
    @abstractmethod
    def get_modified_dataframe_indexes(cls, params: Dict[str, Any]) -> Set[int]:
        """
        Returns a set of all the sheet indexes that were modified
        by this step.

        If it returns an empty set, then this step
        modified every dataframe.

        If it returned -1, then it modified all new dataframes (on
        the left side of the dfs array).
        """
        pass
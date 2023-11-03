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
from mitosheet.types import ColumnHeader, ColumnID, ExecuteThroughTranspileNewDataframeParams, ExecuteThroughTranspileNewColumnParams
 
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
    def execute(cls, prev_state: State, params: Dict[str, Any]) -> Tuple[State, Optional[Dict[str, Any]]]:
        """
        1. Parse params
        2. Error check (using no functions specific to Pandas)
        3. Build necessary execution data - namely, new column header info or new dataframe info
        3. Execute the transpiled code to make the new state
        4. Build a result from this

        Execute always returns the post_state, and optionally returns a dictionary
        of execution_data, which is data that may be useful to the transpiler in
        transpiling the code.

        If the execution_data also includes the key `pandas_processing_time`, this 
        will allow the logging infrastructure to determine how much overhead Mito
        adds to executing this event.

        By default, this function will return the result of just executing the transpiled
        code. 

        In general, this function should use _no_ Pandas specific functionality, but rather 
        should just be a) updating metadata or b) computing results from executed code
        that is useful to the spreadsheet.
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
        column_headers_to_column_ids: Optional[Dict[ColumnHeader, ColumnID]]=None,
        use_deprecated_id_algorithm: bool=False
    ) -> Tuple[State, Dict[str, Any]]:
        """
        Previously, we had a ton of duplicated code in the execute and the code chunk functions. This was annoying 
        for a few reasons:
        1. Duplicated code introduced the possibility that things worked differently on our backend vs. in our generated code. 
        2. It was more work to write, since you had to write everything twice.
        3. It meant we were tied to a specific programming framework like pandas 

        This function was introduced so that we can instead just do the `execute` method simply by executing the 
        code that we would have generated for this step. Thus, the only thing `execute` ends up being responsible 
        for is doing error handling, updating some metadata about the step, or computing a result to return to the
        frontend. In other words: everything other than the actual execution, which is handled by this code here.

        This code works similarly to the AI recon, in that it uses an exec statement and then looks at what changed 
        between before and after the code is executed. However, this code has the additional benefit of knowing what
        it expects to change, so the various parameters are how the caller of this method can tell this function what
        should be different before and after in dataframes.
        """
        from mitosheet.ai.recon import update_state_by_reconing_dataframes

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

        # TODO: this is weird. This will not always be updated, accoring to exec documentation, 
        # but in practice is seems to work...
        exec_globals = get_globals_for_exec(post_state, post_state.public_interface_version)
        exec_locals = {**exec_globals}
        
        pandas_start_time = perf_counter()
        exec(final_code, exec_globals, exec_locals)
        pandas_processing_time = perf_counter() - pandas_start_time

        for modified_dataframe_index in modified_dataframe_indexes:
            df_name = prev_state.df_names[modified_dataframe_index]
            new_df = exec_locals[df_name]
            post_state, _ = update_state_by_reconing_dataframes(
                post_state, 
                modified_dataframe_index, 
                prev_state.dfs[modified_dataframe_index],
                new_df, 
                column_headers_to_column_ids=column_headers_to_column_ids
            )

        if new_dataframe_params:
            sheet_index_to_overwrite = new_dataframe_params['sheet_index_to_overwrite'] 

            for new_df_name in new_dataframe_params['new_df_names']:
                df_source = new_dataframe_params['df_source']

                new_df = exec_locals[new_df_name] 
                post_state.add_df_to_state(new_df, df_name=new_df_name, df_source=df_source, sheet_index=sheet_index_to_overwrite, use_deprecated_id_algorithm=use_deprecated_id_algorithm)

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
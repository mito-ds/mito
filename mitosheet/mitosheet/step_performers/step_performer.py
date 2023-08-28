#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from abc import ABC, abstractmethod
from time import perf_counter
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.state import State
from typing import Any, Dict, List, Optional, Set, Tuple

from mitosheet.transpiler.transpile_utils import get_local_variables_for_exec
 
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

        If the exectution_data includes the key `result`, than this result can be
        accessed in the frontend to display some results to the user. See the 
        DropDuplicatesStepPerformer and the DropDuplicatesCodeChunk for an example of this usage.
        """
        pass

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
    ) -> Tuple[State, float]:
        """
        Some steps can be executed through the transpiled code -- and in these cases, we can call this function
        so that we don't have to duplicate the work we do
        """
        modified_dataframe_indexes = cls.get_modified_dataframe_indexes(params)
        post_state = prev_state.copy(deep_sheet_indexes=modified_dataframe_indexes)

        code_chunks = cls.transpile(post_state, params, {})
        code = []
        for chunk in code_chunks:
            _code, imports = chunk.get_code()
            code.extend(imports)
            code.extend(_code)

        exec_locals = get_local_variables_for_exec(post_state, post_state.public_interface_version)
        
        pandas_start_time = perf_counter()
        exec("\n".join(code), {}, exec_locals)
        pandas_processing_time = perf_counter() - pandas_start_time

        for modified_dataframe_index in modified_dataframe_indexes:
            df_name = prev_state.df_names[modified_dataframe_index]
            new_df = exec_locals[df_name]
            post_state.dfs[modified_dataframe_index] = new_df

        return post_state, pandas_processing_time
        

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
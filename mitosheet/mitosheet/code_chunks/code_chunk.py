#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.


from typing import TYPE_CHECKING, Any, Dict, List, Optional, Union

if TYPE_CHECKING:
    from mitosheet.state import State
else:
    State = Any

class CodeChunk:
    """
    A CodeChunk is the a abstract base class that can be inhereited from
    to create a code generating object. For example, a AddColumnCodeChunk
    with the correct parameters and states will generate code that adds
    a column with a specific column header to a specific dataframe.

    When a step is transpiled, it generates a list of code chunks. In turn,
    we can optimize these code chunks to allow us to write the most minimal
    amount of code. 
    """

    def __init__(self, 
        prev_state: State,
        post_state: State,
        params: Dict[str, Any], 
        execution_data: Optional[Dict[str, Any]]
    ):
        self.prev_state = prev_state
        self.post_state = post_state
        self.params = params
        self.execution_data = execution_data

    def get_display_name(self) -> str:
        """Returns a short name to display for this CodeChunk"""
        raise NotImplementedError('Implement in subclass')
    
    def get_description_comment(self) -> str:
        """Returns a detailed comment explaing what happened in this CodeChunk"""
        raise NotImplementedError('Implement in subclass')

    def get_code(self) -> List[str]:
        """Returns a the list of code strings that this code chunk executes"""
        raise NotImplementedError('Implement in subclass')

    # TODO: we could add a function that returns a list of params and execution
    # data that you're allowed to reference, and then check this when you create
    # the step, for strong typing!

    def get_param(self, key: str) -> Any:
        """
        Gets a value from the params passed to this CodeChunk
        """
        if key in self.params:
            return self.params[key]
        return None

    def get_execution_data(self, key: str) -> Any:
        """
        Gets a value from the execution_data passed to this CodeChunk
        """
        if self.execution_data and key in self.execution_data:
            return self.execution_data[key]
        return None

    def params_match(self, other_code_chunk: "CodeChunk", param_keys: List[str]) -> bool:
        """
        Given a different code chunk, and a list of keys to check, returns True if
        all the given keys match in the params. A useful utility for checking if 
        CodeChunks are compatible for combination.
        """
        for key in param_keys:
            if self.get_param(key) != other_code_chunk.get_param(key):
                return False
        return True

    def get_created_sheet_indexes(self) -> Optional[List[int]]:
        """
        Dataframe deletes allow us to optimize a lot of code, we allow steps to
        optionally say that they only create some specific list of sheet_indexes.

        If this function returns a sheet index, and later dataframe delete steps
        delete this sheet index, then we will optimize out this step as well as
        the deleting of the dataframe.

        NOTE: if this funciton returns None, it is this CodeChunk saying that
        it cannot do any optimization with dataframe delete - which we do by
        default.
        """
        return None
    
    def get_edited_sheet_indexes(self) -> Optional[List[int]]:
        """
        Dataframe deletes allow us to optimize a lot of code, we allow steps to
        optionally say that they only edit some specific list of sheet_indexes.

        This allows us to easily optimize out these steps if the dataframe they 
        are editing is then deleted.

        NOTE: if this funciton returns None, it is this CodeChunk saying that
        it cannot do any optimization with dataframe delete - which we do by
        default.
        """
        return None
    
    def combine_right(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        """
        Given a list of CodeChunks [A, B], combine right called on A with
        B as a parameter will check if A and B can be combined into a new
        CodeChunk. 

        If they cannot be combined, None will be returned. If they can be
        combined, the new combined CodeChunk will be returned, and thus
        [A, B] goes to [A.combine_right(B)]
        """
        return None
    
    def combine_left(self, other_code_chunk: "CodeChunk") -> Optional["CodeChunk"]:
        """Given a list of CodeChunks [A, B], combine right called on B with
        A as a parameter will check if A and B can be combined into a new
        CodeChunk. 

        If they cannot be combined, None will be returned. If they can be
        combined, the new combined CodeChunk will be returned, and thus
        [A, B] goes to [B.combine_right(A)]

        NOTE: combine_lefts are only done after the combine_rights. You might want
        to do one vs. the other depending on how natural it is to express. For example,
        because deleting a dataframe delete can remove a ton of other steps, expressing
        it as a combine_left is much more natural as it results in this optimization
        code all living in one location.
        """
        return None
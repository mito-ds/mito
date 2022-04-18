
from copy import copy
from typing import List, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk



def optimize_code_chunks_combine_right(code_chunks_to_optimize: List[CodeChunk]) -> Tuple[bool, List[CodeChunk]]:
    """
    Given a list of code chunks, will attempt to optimize them right
    with a single pass.
    """

    code_chunks_to_optimize = copy(code_chunks_to_optimize)
    code_chunks_to_optimize.reverse() # Reverse the list so we can pop from the old front quickly

    code_chunks_list: List[CodeChunk] = []

    optimized = False
    while len(code_chunks_to_optimize) >= 2:
        later_code_chunk = code_chunks_to_optimize.pop()
        earlier_code_chunk = code_chunks_to_optimize.pop()

        combined_chunk = later_code_chunk.combine_right(earlier_code_chunk)

        if combined_chunk is not None:
            # If we can combine the two chunks into one, take that
            optimized = True
            code_chunks_to_optimize.append(combined_chunk)
        else:
            # If we cannot combine the two chunks, take the first chunk, 
            # and reset the second one to the new first chunk for the next loop
            code_chunks_list.append(later_code_chunk)
            code_chunks_to_optimize.append(earlier_code_chunk)            
    
    # Make sure we take the final item in the code chunks list, 
    # as it has nothing to combine_right with
    if len(code_chunks_to_optimize) == 1:
        code_chunks_list.append(code_chunks_to_optimize[0])

    return optimized, code_chunks_list

def optimize_code_chunks_combine_left(code_chunks_to_optimize: List[CodeChunk]) -> Tuple[bool, List[CodeChunk]]:
    """
    Given a list of code chunks, will attempt to optimize them left
    with a single pass.
    """

    code_chunks_to_optimize = copy(code_chunks_to_optimize)
    code_chunks_list: List[CodeChunk] = []

    optimized = False
    while len(code_chunks_to_optimize) >= 2:
        later_code_chunk = code_chunks_to_optimize.pop()
        earlier_code_chunk = code_chunks_to_optimize.pop()

        combined_chunk = later_code_chunk.combine_left(earlier_code_chunk)

        if combined_chunk is not None:
            # If we can combine the two chunks into one, take that
            optimized = True
            code_chunks_to_optimize.append(combined_chunk)
        else:
            # If we cannot combine the two chunks, take the first chunk, 
            # and reset the second one to the new first chunk for the next loop
            code_chunks_list.append(later_code_chunk)
            code_chunks_to_optimize.append(earlier_code_chunk)            
    
    # Make sure we take the final item in the code chunks list, 
    # as it has nothing to combine_left with
    if len(code_chunks_to_optimize) == 1:
        code_chunks_list.append(code_chunks_to_optimize[0])

    # Since we build the result backwards, we have to reverse it at the end
    code_chunks_list.reverse()

    return optimized, code_chunks_list


def optimize_code_chunks(all_code_chunks: List[CodeChunk]) -> List[CodeChunk]:
    """
    Given a list of code chunks, will recursively attempt to optimize them 
    down to the smallest list of code chunks that have the same effects
    as the original list. 

    This is necessarily recursive, because of a situation like [A, A, B, B], 
    where A and B can be combined to a No-op. Thus, after one call, we end with 
    [A, B], and we need to recurse to finish the optimization.
    """

    optimized_right, code_chunks_list = optimize_code_chunks_combine_right(all_code_chunks)
    optimized_left, code_chunks_list = optimize_code_chunks_combine_left(code_chunks_list)

    # As long as we optimized in this iteration, recurse as we might
    # need to optimize again
    if optimized_right or optimized_left:
        return optimize_code_chunks(code_chunks_list)

    return code_chunks_list
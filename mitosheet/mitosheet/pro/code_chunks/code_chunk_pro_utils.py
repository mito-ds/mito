
from copy import copy
from typing import List, Dict, Tuple
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


def reorder_code_chunks_for_more_optimization(all_code_chunks: List[CodeChunk]) -> Tuple[bool, List[CodeChunk]]:
    """
    Sometimes a user will perform actions in an order that is not super
    advantageous to code optimization. As such, we do our best to reorder
    code chunks in a way that:
    1. Absolutely is safe -- there should be no changes in behavior
    2. Results in a better code optimization

    The logic for when code chunks can be reordered can be found in 
    the can_be_reordered_with function defined on code chunks. 
    """
    if len(all_code_chunks) < 3:
        return False, all_code_chunks
    
    reordered = False
    final_code_chunks = [all_code_chunks[0], all_code_chunks[1]]
    for code_chunk in all_code_chunks[2:]:
        
        added = False
        for i in range(1, len(final_code_chunks)):
            one_back_code_chunk = final_code_chunks[-1 * i]
            two_back_code_chunk = final_code_chunks[-1 * i - 1]

            if one_back_code_chunk.can_be_reordered_with(code_chunk) and code_chunk.can_be_reordered_with(one_back_code_chunk):
                # Because this function is called after left and right optimization, we 
                # know that the one_back_code_chunk will not optimize with this one. So 
                # we check if this code chunk could be optimized with the two_back_code_chunk
                # and move it there if so. 
                optimized_right = two_back_code_chunk.combine_right(code_chunk) is not None
                optimized_left = code_chunk.combine_right(two_back_code_chunk) is not None

                if optimized_right or optimized_left:
                    final_code_chunks.insert(-1 * i, code_chunk)
                    reordered = True
                    added = True
                    break
            
            else:

                final_code_chunks.append(code_chunk)
                added = True
                break
        
        if not added:
            final_code_chunks.append(code_chunk)

    return reordered, final_code_chunks

def optimize_code_chunks(all_code_chunks: List[CodeChunk]) -> List[CodeChunk]:
    """
    Given a list of code chunks, will recursively attempt to optimize them 
    down to the smallest list of code chunks that have the same effects
    as the original list. 

    This is necessarily recursive, because of a situation like [A, A, B, B], 
    where A and B can be combined to a No-op. Thus, after one call, we end with 
    [A, B], and we need to recurse to finish the optimization.
    """
    # First, try and remove code chunks we know we can remove
    optimized_right, all_code_chunks = optimize_code_chunks_combine_right(all_code_chunks)
    optimized_left, all_code_chunks = optimize_code_chunks_combine_left(all_code_chunks)

    # Then, reorder the code chunks to be more optimal
    reordered, all_code_chunks = reorder_code_chunks_for_more_optimization(all_code_chunks)

    # As long as we optimized in this iteration, recurse as we might
    # need to optimize again
    if optimized_right or optimized_left or reordered:
        return optimize_code_chunks(all_code_chunks)

    return all_code_chunks
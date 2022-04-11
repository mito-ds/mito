
from copy import copy
from typing import List
from mitosheet.code_chunks.code_chunk import CodeChunk


def optimize_code_chunks(all_code_chunks: List[CodeChunk]) -> List[CodeChunk]:
    """
    Given a list of code chunks, will recursively attempt to optimize them 
    down to the smallest list of code chunks that have the same effects
    as the original list. 

    This is necessarily recursive, because of a situation like [A, A, B, B], 
    where A and B can be combined to a No-op. Thus, after one call, we end with 
    [A, B], and we need to recurse to finish the optimization.
    """

    all_code_chunks_reversed = copy(all_code_chunks)
    all_code_chunks_reversed.reverse() # Reverse the list so we can pop from the old front quickly

    code_chunks_list: List[CodeChunk] = []

    optimized = False
    while len(all_code_chunks_reversed) >= 2:
        first_code_chunk = all_code_chunks_reversed.pop()
        second_code_chunk = all_code_chunks_reversed.pop()

        combined_chunk = first_code_chunk.combine_right(second_code_chunk)

        if combined_chunk is not None:
            # If we can combine the two chunks into one, take that
            optimized = True
            all_code_chunks_reversed.append(combined_chunk)
        else:
            # If we cannot combine the two chunks, take the first chunk, 
            # and reset the second one to the new first chunk for the next loop
            code_chunks_list.append(first_code_chunk)
            all_code_chunks_reversed.append(second_code_chunk)            
    
    # Make sure we take the final item in the code chunks list, 
    # as it has nothing to combine_right with
    if len(all_code_chunks_reversed) == 1:
        code_chunks_list.append(all_code_chunks_reversed[0])

    # TODO: we could combine_left here? This would allow us to 
    # express overwriting conditions very naturally for deleting
    # dataframes...

    # As long as we optimized in this iteration, recurse as we might
    # need to optimize again
    if optimized:
        return optimize_code_chunks(code_chunks_list)

    return code_chunks_list
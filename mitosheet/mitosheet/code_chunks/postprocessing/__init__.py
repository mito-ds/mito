# This folder includes all the code chunks that should _always_ be at the end of the 
# transpiled code. This is useful for things like the formatting, which needs to be
# at the end. Note that these should be transpiled with with the latest state in the
# analysis


from mitosheet.code_chunks.postprocessing.set_dataframe_format_code_chunk import SetDataframeFormatCodeChunk


POSTPROCESSING_CODE_CHUNKS = [
    SetDataframeFormatCodeChunk
]
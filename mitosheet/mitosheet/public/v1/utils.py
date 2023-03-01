from mitosheet.types import ColumnHeader


def flatten_column_header(column_header: ColumnHeader) -> ColumnHeader:
    """
    Given a pandas column header, if it is a list or tuple, it will
    flatten this header into a string. 

    This is useful for headers that are created from a pivot table,
    where they are often tuples or lists.

    NOTE: This function, if applied before the depricated make_valid_header
    function, should return the same result for any input. That is:
    For all column headers:
    make_valid_header(flatten_column_header(ch)) = make_valid_header(ch)
    """
    if isinstance(column_header, list) or isinstance(column_header, tuple):
        column_header_str = [str(ch) for ch in column_header]
        return ' '.join(column_header_str).strip()

    return column_header
from typing import List


def deduplicate_array(my_list: List) -> List:
    seen = {}
    new_list = [seen.setdefault(x, x) for x in my_list if x not in seen]
    return new_list
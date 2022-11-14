from typing import List, TypeVar, Dict

T = TypeVar('T')

def deduplicate_array(my_list: List[T]) -> List:
    seen: Dict[T, T] = {}
    new_list = [seen.setdefault(x, x) for x in my_list if x not in seen]
    return new_list



from typing import Any, List


def get_deduplicated_list(l: List[Any]) -> List[Any]:
    new_list = []
    for i in l:
        if i not in new_list:
            new_list.append(i)
    return new_list


def get_list_difference(l1: List[Any], l2: List[Any]) -> List[Any]:
    second = set(l2)
    return [item for item in l1 if item not in second]
from typing import List, Dict, Any


def get_script_from_cells(cells: List[str]) -> str:
    return "\n".join(cells)

def get_globals_to_compare(globals: Dict[str, Any]) -> Dict[str, Any]:
    """
    Globals have a lot of stuff we don't actually care about comparing. 
    For now, we only care about comparing variables created by the script.
    This functionremoves everything else
    """

    globals = {k: v for k, v in globals.items() if k != "__builtins__"}

    # Remove functions from the globals since we don't want to compare them
    globals = {k: v for k, v in globals.items() if not callable(v)}

    return globals
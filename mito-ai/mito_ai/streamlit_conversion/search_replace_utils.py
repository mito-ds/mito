# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

import re
from typing import List, Tuple

from mito_ai.utils.error_classes import StreamlitConversionError
from mito_ai.utils.telemetry_utils import log


def extract_search_replace_blocks(message_content: str) -> List[Tuple[str, str]]:
    """
    Extract all search_replace blocks from Claude's response.
    
    Returns:
        List of tuples (search_text, replace_text) for each search/replace block
    """
    if "```search_replace" not in message_content:
        return []
    
    pattern = r'```search_replace\n(.*?)```'
    matches = re.findall(pattern, message_content, re.DOTALL)
    
    search_replace_pairs = []
    for match in matches:
        # Split by the separator
        if "=======" not in match:
            continue
            
        parts = match.split("=======", 1)
        if len(parts) != 2:
            continue
            
        search_part = parts[0]
        replace_part = parts[1]
        
        # Extract search text (after SEARCH marker)
        if ">>>>>>> SEARCH" in search_part:
            search_text = search_part.split(">>>>>>> SEARCH", 1)[1].strip()
        else:
            continue
            
        # Extract replace text (before REPLACE marker)
        if "<<<<<<< REPLACE" in replace_part:
            replace_text = replace_part.split("<<<<<<< REPLACE", 1)[0].strip()
        else:
            continue
            
        search_replace_pairs.append((search_text, replace_text))
    
    return search_replace_pairs


def apply_search_replace(text: str, search_replace_pairs: List[Tuple[str, str]]) -> str:
    """
    Apply search/replace operations to the given text.
    
    Parameters
    ----------
    text : str
        The original file contents.
    search_replace_pairs : List[Tuple[str, str]]
        List of (search_text, replace_text) tuples to apply.
        
    Returns
    -------
    str
        The updated contents after applying all search/replace operations.
        
    Raises
    ------
    ValueError
        If a search text is not found or found multiple times.
    """
    if not search_replace_pairs:
        return text
    
    result = text
    
    for search_text, replace_text in search_replace_pairs:
        # Count occurrences of search text
        count = result.count(search_text)
        
        if count == 0:
            print("Search Text Not Found: ", repr(search_text))
            raise StreamlitConversionError(f"Search text not found: {repr(search_text)}", error_code=500)
        elif count > 1:
            print("Search Text Found Multiple Times: ", repr(search_text))
            log("mito_ai_search_text_found_multiple_times", params={"search_text": repr(search_text)}, key_type="mito_server_key")

        # Perform the replacement
        result = result.replace(search_text, replace_text, 1)
    
    return result
# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Optional
from mito_ai.rules.utils import get_rule

def get_rules_str(selected_rules: Optional[List[str]]) -> str:
    """
    Get a string of the rules that the user has selected.
    """
    if selected_rules is None:
        return ''
    
    rules_str = ''
    for rule in selected_rules:
        rule_content = get_rule(rule)
        if rule_content is None or rule_content == '':
            continue
        
        rules_str += f"===========\n\nCustom Instructions Provided by User: {rule}\n\n{rule_content}\n\n==========="
    
    return rules_str

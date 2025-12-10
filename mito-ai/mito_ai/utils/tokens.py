# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import List, Union, Optional
import anthropic
from anthropic.types import MessageParam, TextBlockParam, ToolUnionParam


def get_rough_token_estimatation_anthropic(system_message: Union[str, List[TextBlockParam], anthropic.Omit], messages: List[MessageParam]) -> Optional[float]: 
    """
    Get a very rough estimation of the number of tokens in a conversation. 
    We bias towards overestimating to make sure we don't accidentally
    think a conversation is safe to send to an AI without having applied an
    optimization strategy. 
    """
    
    try:
        stringified_system_message = str(system_message)
        stringified_messages = str(messages)
        total_stringified_context = stringified_system_message + stringified_messages 
        
        # The general rule of thumb is: 1 token is about 4 characters. 
        # To be safe we use:            1 token is about 3 characters
        # This helps make sure we always overestimate
        return len(total_stringified_context) / 3
    
    except: 
        return None


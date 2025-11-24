from typing import List, Union, Optional
import anthropic
from anthropic.types import MessageParam, TextBlockParam, ToolUnionParam


def get_rough_token_estimatation_anthropic(system_message: Union[str, List[TextBlockParam], anthropic.Omit], messages: List[MessageParam]) -> Optional[float]: 
    """
    Get a very rough estimation of the number of tokens in a conversation. 
    We bias towards overestimating to make sure we don't accidentally
    think a conversation is safe to send to an AI without having applied an
    optimization strategy. 
    
    General rule of thumb: 1 token is about 4 characters. 
    To be safe we use: 1 token is about 5 characters
    """
    
    try:
        stringified_system_message = str(system_message)
        stringified_messages = str(messages)
        total_stringified_context = stringified_system_message + stringified_messages 
        
        return len(total_stringified_context) / 5 + 1
    
    except: 
        return None


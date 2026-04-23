# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Any, List, Union, Optional
import anthropic
from anthropic.types import MessageParam, TextBlockParam, ToolUnionParam


def get_rough_token_estimation_from_payload(payload: Any) -> Optional[int]:
    """
    Get a rough estimation of token count for any serializable payload.
    We bias towards overestimating so we do not under-count context size.
    """
    try:
        # General rule of thumb: 1 token ~= 4 chars.
        # We bias high with 1 token ~= 3 chars.
        return int(len(str(payload)) / 3)
    except Exception:
        return None


def get_rough_token_estimatation_anthropic(system_message: Union[str, List[TextBlockParam], anthropic.Omit], messages: List[MessageParam]) -> Optional[float]: 
    """
    Get a very rough estimation of the number of tokens in a conversation. 
    We bias towards overestimating to make sure we don't accidentally
    think a conversation is safe to send to an AI without having applied an
    optimization strategy. 
    """
    
    total_context_payload = [system_message, messages]
    rough_estimate = get_rough_token_estimation_from_payload(total_context_payload)
    return float(rough_estimate) if rough_estimate is not None else None


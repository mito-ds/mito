from mito_ai.models import MessageType

# Model name constants
GPT4O_MINI = "gpt-4o-mini"
O3_MINI = "o3-mini"

# Mapping from message type to model name
MESSAGE_TYPE_TO_MODEL = {
    MessageType.SMART_DEBUG: GPT4O_MINI,
    MessageType.CHAT: O3_MINI,
    MessageType.CODE_EXPLAIN: GPT4O_MINI,
    MessageType.INLINE_COMPLETE: GPT4O_MINI,
    MessageType.AGENT_AUTO_ERROR_FIXUP: GPT4O_MINI,
    MessageType.AGENT_EXECUTION: O3_MINI,
    MessageType.AGENT_PLANNING: O3_MINI 
}

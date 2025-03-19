from mito_ai.models import MessageType

# Model name constants
GPT4O_MINI = "gpt-4o-mini"
GPT4O = "gpt-4o"
O3_MINI = "o3-mini"

# Mapping from message type to model name
MESSAGE_TYPE_TO_MODEL = {
    MessageType.SMART_DEBUG: GPT4O,
    MessageType.CHAT: GPT4O,
    MessageType.CODE_EXPLAIN: GPT4O,
    MessageType.INLINE_COMPLETION: GPT4O_MINI,
    MessageType.AGENT_AUTO_ERROR_FIXUP: GPT4O,
    MessageType.AGENT_EXECUTION: GPT4O,
    MessageType.CHAT_NAME_GENERATION: GPT4O
}
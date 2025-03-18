from mito_ai.models import MessageType

# Model name constants
GPT4O_MINI = "gpt-4o-mini"
O3_MINI = "o3-mini"
CLAUDE_3_5_SONNET = "claude-3-7-sonnet-20250219"

# Mapping from message type to model name
MESSAGE_TYPE_TO_MODEL = {
    MessageType.SMART_DEBUG: CLAUDE_3_5_SONNET,
    MessageType.CHAT: CLAUDE_3_5_SONNET,
    MessageType.CODE_EXPLAIN: CLAUDE_3_5_SONNET,
    MessageType.INLINE_COMPLETION: CLAUDE_3_5_SONNET,
    MessageType.AGENT_AUTO_ERROR_FIXUP: CLAUDE_3_5_SONNET,
    MessageType.AGENT_EXECUTION: CLAUDE_3_5_SONNET,
    MessageType.CHAT_NAME_GENERATION: CLAUDE_3_5_SONNET
}

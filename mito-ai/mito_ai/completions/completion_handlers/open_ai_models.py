# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from mito_ai.completions.models import MessageType

# Model name constants
GPT4O_MINI = "gpt-4o-mini"
GPT4O = "gpt-4o"
O3_MINI = "o3-mini"
GPT41 = "gpt-4.1"
GPT41_NANO = "gpt-4.1-nano"

# Mapping from message type to model name
MESSAGE_TYPE_TO_MODEL = {
    MessageType.SMART_DEBUG: GPT41,
    MessageType.CHAT: GPT41,
    MessageType.CODE_EXPLAIN: GPT41,
    MessageType.INLINE_COMPLETION: GPT41_NANO,
    MessageType.AGENT_AUTO_ERROR_FIXUP: GPT41,
    MessageType.AGENT_EXECUTION: GPT41,
    MessageType.CHAT_NAME_GENERATION: GPT41_NANO
}

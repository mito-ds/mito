# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

from typing import Callable, Union

from mito_ai.completions.models import (
    CommentInstantAnswerMetadata,
    CompletionReply,
    CompletionStreamChunk,
    MessageType,
)
from mito_ai_core.completions.ai_optimized_message import create_ai_optimized_message
from mito_ai_core.completions.prompt_builders.comment_instant_answer_prompt import (
    create_comment_instant_answer_prompt,
)
from mito_ai_core.provider_manager import ProviderManager

__all__ = ["stream_comment_instant_answer"]


async def stream_comment_instant_answer(
    metadata: CommentInstantAnswerMetadata,
    provider: ProviderManager,
    message_id: str,
    reply_fn: Callable[[Union[CompletionReply, CompletionStreamChunk]], None],
) -> str:
    """Stream an answer to a document-mode comment.

    Each instant answer is independent and ephemeral, like inline completions:
    it never reads from or writes to the chat message history, so it can run
    while the agent is working on the same thread.
    """
    has_cell_output = (
        metadata.base64EncodedCellOutput is not None
        and metadata.base64EncodedCellOutput != ""
    )

    prompt = create_comment_instant_answer_prompt(
        metadata.commentType,
        metadata.commentValue,
        metadata.variables or [],
        metadata.files or [],
        metadata.aiOptimizedCells or [],
        has_cell_output,
    )

    # Attach the commented cell's output image (if any) to the message
    message = create_ai_optimized_message(prompt, metadata.base64EncodedCellOutput)

    return await provider.stream_completions(
        message_type=MessageType.COMMENT_INSTANT_ANSWER,
        messages=[message],
        message_id=message_id,
        thread_id="comment-instant-answer",
        reply_fn=reply_fn,
        use_fast_model=True,
    )

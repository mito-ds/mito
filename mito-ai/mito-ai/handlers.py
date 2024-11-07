import asyncio
import json
import os
import time
import traceback
from asyncio import AbstractEventLoop
from dataclasses import asdict
from http import HTTPStatus
from logging import Logger
from typing import Any, Dict, List, Optional, Type, Union

import openai
import tornado
import tornado.ioloop
from jupyter_core.utils import ensure_async
from jupyter_server.base.handlers import APIHandler, JupyterHandler
from openai import OpenAI
from tornado import web

from .models import (
    CompletionError,
    InlineCompletionItem,
    InlineCompletionList,
    InlineCompletionReply,
    InlineCompletionRequest,
    InlineCompletionStreamChunk,
)
from .providers import OpenAIProvider
from .utils.open_ai_utils import get_open_ai_completion

__all__ = ["OpenAICompletionHandler", "InlineCompletionHandler"]


# This handler is responsible for the mito_ai/completion endpoint. 
# It takes a message from the user, sends it to the OpenAI API, and returns the response.
# Important: Because this is a server extension, print statements are sent to the 
# jupyter server terminal by default (ie: the terminal you ran `jupyter lab`)
class OpenAICompletionHandler(APIHandler):
    @web.authenticated
    def post(self):
        # Retrieve the message from the request
        data = self.get_json_body()
        messages = data.get('messages', '')

        try:
            # Query OpenAI API
            response = get_open_ai_completion(messages)
            self.finish(json.dumps(response))
        except PermissionError as e:
            # Raise a PermissionError when the user has 
            # reached the free tier limit for Mito AI.
            self.set_status(403)
            self.finish()
        except Exception as e:
            # Catch all other exceptions and return a 500 error
            self.set_status(500)
            self.finish()


class InlineCompletionHandler(JupyterHandler, tornado.websocket.WebSocketHandler):
    def initialize(self, llm: OpenAIProvider):
        super().initialize()
        self.log.debug("Initializing websocket connection %s", self.request.path)
        self._llm = llm
        self._bg_tasks: List[asyncio.Task] = []

    def __del__(self):
        all_tasks = asyncio.gather(*self._bg_tasks, return_exceptions=True)
        all_tasks.cancel()
        asyncio.shield(asyncio.wait_for(all_tasks, timeout=5))

    async def pre_get(self):
        """Handles authentication/authorization."""
        # authenticate the request before opening the websocket
        user = self.current_user
        if user is None:
            self.log.warning("Couldn't authenticate WebSocket connection")
            raise tornado.web.HTTPError(HTTPStatus.UNAUTHORIZED)

        # authorize the user.
        if not await ensure_async(
            self.authorizer.is_authorized(self, user, "execute", "mito-ai-completion")
        ):
            raise tornado.web.HTTPError(HTTPStatus.FORBIDDEN)

    async def get(self, *args, **kwargs):
        """Get an event socket."""
        await ensure_async(self.pre_get())
        res = super().get(*args, **kwargs)
        if res is not None:
            await res

    async def on_message(self, message):
        """Handle incoming messages on the WebSocket."""

        # first, verify that the message is an `InlineCompletionRequest`.
        self.log.debug("Message received: %s", message)
        try:
            message = json.loads(message)
            request = InlineCompletionRequest(**message)
        except ValueError as e:
            self.log.error("Invalid inline completion request.", exc_info=e)
            return

        # next, dispatch the request to the correct handler and create the
        # `handle_request` coroutine object
        handle_request = None
        if request.stream:
            try:
                handle_request = self._handle_stream_request(request)
            except NotImplementedError:
                self.log.error(
                    "Unable to handle stream request. The current `InlineCompletionHandler` does not implement the `handle_stream_request()` method."
                )
                return

        else:
            handle_request = self._handle_request(request)

        # finally, wrap `handle_request` in an exception handler, and start the
        # task on the event loop.
        async def handle_request_and_catch():
            try:
                await handle_request
            except Exception as e:
                await self.handle_exc(e, request)

        task = asyncio.create_task(handle_request_and_catch())
        task.add_done_callback(lambda t: self._bg_tasks.remove(t))
        self._bg_tasks.append(task)

    async def handle_exc(self, e: Exception, request: InlineCompletionRequest):
        """
        Handles an exception raised in either `handle_request()` or
        `handle_stream_request()`. This base class provides a default
        implementation, which may be overridden by subclasses.
        """
        error = CompletionError(
            type=e.__class__.__name__,
            title=e.args[0] if e.args else "Exception",
            traceback=traceback.format_exc(),
        )
        self.reply(
            InlineCompletionReply(
                list=InlineCompletionList(items=[]),
                error=error,
                reply_to=request.number,
            )
        )

    async def _handle_request(self, request: InlineCompletionRequest) -> None:
        """Handle completion request."""
        start = time.time()
        reply = await self._llm.request_completions(request)
        self.reply(reply)
        latency_ms = round((time.time() - start) * 1000)
        self.log.info(f"Inline completion handler resolved in {latency_ms} ms.")

    async def _handle_stream_request(self, request: InlineCompletionRequest) -> None:
        """Handle stream completion request."""
        start = time.time()
        async for reply in self.llm.stream_inline_completions(request):
            self.reply(reply)
        latency_ms = round((time.time() - start) * 1000)
        self.log.info(f"Inline completion streaming completed in {latency_ms} ms.")

    def reply(self, reply: Union[InlineCompletionReply, InlineCompletionStreamChunk]):
        """Write a reply object to the WebSocket connection."""
        message = asdict(reply)
        super().write_message(message)

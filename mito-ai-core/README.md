# mito-ai-core

The shared Python AI layer for Mito -- LLM providers, models, prompts, and utils. No Jupyter Server or Tornado dependency.

`mito-ai` (the JupyterLab extension) depends on this package for all its AI logic. If you're building something else on top of Mito's AI stack, this is the package you want.

## Install

```bash
pip install mito-ai-core
```

## Development

### Working on mito-ai-core only

```bash
cd mito-ai-core
pip install -e ".[test]"
```

### Working on both mito-ai-core and mito-ai at the same time

Install both packages in editable mode so changes in either package are picked up immediately without reinstalling:

```bash
# From the repo root
pip install -e ./mito-ai-core
pip install -e "./mito-ai[test]"
```

**Order matters!** Install `mito-ai-core` first since `mito-ai` depends on it. After this, any change you make to a `.py` file in either package takes effect on the next import (no rebuild needed).

### How it relates to mito-ai

`mito-ai-core` contains all the pure-Python AI logic -- providers, models, prompts, message history, utils.

`mito-ai` is the JupyterLab extension that adds WebSocket/REST handlers, UI integration, and Streamlit conversion on top of it.

If you're changing provider logic, prompt templates, or models, you're working here. If you're changing how the extension talks to the frontend or handles HTTP requests, you're working in `mito-ai`.

## Usage

Everything goes through `ProviderManager`:

```python
from mito_ai_core.provider_manager import ProviderManager
from mito_ai_core.completions.models import MessageType

pm = ProviderManager()
pm.set_selected_model("gpt-4.1")

# One-shot
response = await pm.request_completions(
    message_type=MessageType.CHAT,
    messages=[{"role": "user", "content": "Hello!"}],
)

# Streaming -- pass a callback
response = await pm.stream_completions(
    message_type=MessageType.CHAT,
    messages=[{"role": "user", "content": "Hello!"}],
    message_id="msg-1",
    thread_id="thread-1",
    reply_fn=lambda chunk: print(chunk),
)
```

`ProviderManager` picks the right client (OpenAI, Anthropic, Gemini, Copilot, LiteLLM, Abacus) based on the selected model. It handles retries, telemetry, and token logging.

This is a library, not a server. The caller owns the transport (WebSocket, HTTP, CLI, whatever).

## Key modules

- **`provider_manager`** -- routes requests to the right LLM client
- **`clients/`** -- OpenAI, Anthropic, Gemini, Copilot wrappers
- **`completions/models`** -- all the dataclasses and Pydantic models
- **`completions/message_history`** -- thread-safe chat persistence
- **`completions/prompt_builders/`** -- prompt construction for chat, agent, debug, inline completion, charts
- **`utils/`** -- model resolution, token estimation, telemetry, rate limits


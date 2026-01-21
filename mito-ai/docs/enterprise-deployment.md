# Enterprise Deployment Guide

This guide explains how to configure Mito AI for enterprise deployments with strict data privacy and security requirements.

## Overview

Enterprise mode in Mito AI provides:

1. **LLM Model Lockdown**: AI calls ONLY go to IT-approved LLM models
2. **Telemetry Elimination**: No telemetry is sent to Mito servers
3. **User Protection**: End users cannot change to unapproved LLM models
4. **LiteLLM Support**: Optional support for LiteLLM endpoints when enterprise mode is enabled

## Enabling Enterprise Mode

Enterprise mode is automatically enabled when the `mitosheet-helper-enterprise` package is installed. This package must be installed by your IT team with appropriate permissions.

```bash
pip install mitosheet-helper-enterprise
```

**Note**: Enterprise mode does not lock users out - they can continue using the Mito server normally if LiteLLM is not configured.

## LiteLLM Configuration (Optional)

When enterprise mode is enabled, you can optionally configure LiteLLM to route all AI calls to your approved LLM endpoint. LiteLLM configuration is **optional** - if not configured, users can continue using the normal Mito server flow.

### Prerequisites

1. **LiteLLM Server**: Your IT team must have a LiteLLM server running that exposes an OpenAI-compatible API
2. **API Compatibility**: The LiteLLM endpoint must be compatible with the OpenAI Chat Completions API specification
3. **Network Access**: End users must have network access to the LiteLLM server endpoint
4. **API Key Management**: Each end user must have their own API key for authentication with the LiteLLM server

### Environment Variables

Configure the following environment variables on the Jupyter server:

#### IT-Controlled Variables (Set by IT Team)

- **`LITELLM_BASE_URL`**: The base URL of your LiteLLM server endpoint
  - Example: `https://your-litellm-server.com`
  - Must be OpenAI-compatible

- **`LITELLM_MODELS`**: Comma-separated list of approved model names
  - Model names must include provider prefix (e.g., `"openai/gpt-4o"`)
  - Example: `"openai/gpt-4o,openai/gpt-4o-mini,anthropic/claude-3-5-sonnet"`
  - Format: Comma-separated string (whitespace is automatically trimmed)

#### User-Controlled Variables (Set by Each End User)

- **`LITELLM_API_KEY`**: User's API key for authentication with the LiteLLM server
  - Each user sets their own API key
  - Keys are never sent to Mito servers

### Example Configuration

#### Jupyter Server Configuration File

Create or update your Jupyter server configuration file (typically `~/.jupyter/jupyter_server_config.py` or `/etc/jupyter/jupyter_server_config.d/mito_ai_enterprise.json`):

```python
# For Python config file
import os
os.environ["LITELLM_BASE_URL"] = "https://your-litellm-server.com"
os.environ["LITELLM_MODELS"] = "openai/gpt-4o,openai/gpt-4o-mini"
```

Or for JSON config:

```json
{
  "ServerApp": {
    "environment": {
      "LITELLM_BASE_URL": "https://your-litellm-server.com",
      "LITELLM_MODELS": "openai/gpt-4o,openai/gpt-4o-mini"
    }
  }
}
```

#### User Environment Variables

Each end user should set their own API key in their environment:

```bash
export LITELLM_API_KEY="sk-user-specific-api-key"
```

Or in their shell profile (`.bashrc`, `.zshrc`, etc.):

```bash
export LITELLM_API_KEY="sk-user-specific-api-key"
```

## Behavior

### When Enterprise Mode is Enabled

1. **Telemetry**: All telemetry is automatically disabled
2. **Model Selection**: 
   - If LiteLLM is configured: Users can only select from IT-approved models in `LITELLM_MODELS`
   - If LiteLLM is not configured: Users can use standard models via Mito server
3. **Model Validation**: Backend validates all model selections against the approved list
4. **UI Lockdown**: Frontend only displays approved models

### When Enterprise Mode is NOT Enabled

- LiteLLM environment variables are **ignored**
- Normal Mito AI behavior continues
- Standard model selection is available

## Security Guarantees

1. **Defense in Depth**:
   - Backend validates all model selections (even if frontend is bypassed)
   - Enterprise mode is determined by package installation (users cannot modify without admin access)
   - Configuration environment variables are server-side only (users cannot modify)
   - Frontend UI only shows approved models

2. **Telemetry Elimination**:
   - Early return in telemetry functions when enterprise mode is active
   - No analytics library calls made
   - No network requests to external telemetry servers

3. **Model Lockdown** (when LiteLLM is configured):
   - Backend validates all model selections against approved list
   - Backend rejects model change requests for unapproved models
   - Frontend shows only approved models in model selector
   - All API calls go to LiteLLM base URL

4. **API Key Management**:
   - Users set their own `LITELLM_API_KEY` environment variable for authentication
   - IT controls the LiteLLM endpoint and approved models, users control authentication
   - Keys never sent to Mito servers

## Verification

### Check Enterprise Mode Status

When you start Jupyter Lab, check the server logs for:

```
Enterprise mode enabled
LiteLLM configured: endpoint=https://your-litellm-server.com, models=['openai/gpt-4o', 'openai/gpt-4o-mini']
```

### Verify Model Selection

1. Open Mito AI chat in Jupyter Lab
2. Click on the model selector
3. Verify only approved models from `LITELLM_MODELS` are displayed
4. Verify you cannot select unapproved models

### Verify Telemetry Disabled

1. Open browser developer tools (Network tab)
2. Use Mito AI features
3. Verify no requests are made to analytics/telemetry servers

## Troubleshooting

### Models Not Appearing

- **Check environment variables**: Ensure `LITELLM_BASE_URL` and `LITELLM_MODELS` are set correctly
- **Check enterprise mode**: Verify `mitosheet-helper-enterprise` is installed
- **Check server logs**: Look for enterprise mode and LiteLLM configuration messages
- **Restart Jupyter Lab**: Environment variables are read at server startup

### Invalid Model Errors

- **Check model format**: LiteLLM models must include provider prefix (e.g., `"openai/gpt-4o"`)
- **Check model list**: Ensure the model is in the `LITELLM_MODELS` comma-separated list
- **Check API compatibility**: Verify your LiteLLM endpoint supports the requested model

### API Connection Errors

- **Check network access**: Ensure the Jupyter server can reach `LITELLM_BASE_URL`
- **Check API key**: Verify `LITELLM_API_KEY` is set correctly for the user
- **Check endpoint**: Verify `LITELLM_BASE_URL` is correct and the server is running

### Telemetry Still Sending

- **Check enterprise mode**: Verify `mitosheet-helper-enterprise` is installed
- **Check server logs**: Look for "Enterprise mode enabled" message
- **Restart Jupyter Lab**: Enterprise mode is detected at server startup

## API Compatibility Requirements

Your LiteLLM endpoint must be compatible with the OpenAI Chat Completions API. Specifically, it must support:

- **Endpoint**: `/v1/chat/completions` (or equivalent)
- **Method**: POST
- **Request Format**: OpenAI Chat Completions request format
- **Response Format**: OpenAI Chat Completions response format
- **Streaming**: Support for streaming responses (optional but recommended)

### Verification Question for IT Admin

Before deploying, ask your IT admin:

> "Does your LiteLLM endpoint support the OpenAI Chat Completions API specification? Specifically, can it accept POST requests to `/v1/chat/completions` (or equivalent) with the standard OpenAI request format and return responses in the OpenAI response format?"

## Example Deployment

### Step 1: Install Enterprise Package

```bash
pip install mitosheet-helper-enterprise
```

### Step 2: Configure Jupyter Server

Create `/etc/jupyter/jupyter_server_config.d/mito_ai_enterprise.json`:

```json
{
  "ServerApp": {
    "environment": {
      "LITELLM_BASE_URL": "https://your-litellm-server.com",
      "LITELLM_MODELS": "openai/gpt-4o,openai/gpt-4o-mini"
    }
  }
}
```

### Step 3: User API Key Setup

Each user sets their API key in their environment:

```bash
export LITELLM_API_KEY="sk-user-api-key"
```

### Step 4: Restart Jupyter Lab

Restart Jupyter Lab to apply configuration changes.

### Step 5: Verify

1. Check server logs for enterprise mode confirmation
2. Open Mito AI chat
3. Verify only approved models are shown
4. Test a completion to verify it uses LiteLLM endpoint

## Support

For issues or questions about enterprise deployment, contact your IT administrator or Mito support.

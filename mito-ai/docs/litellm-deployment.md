# LiteLLM Enterprise Deployment Guide

This guide explains how to configure Mito AI for enterprise deployments with strict data privacy and security requirements.

## Overview

Enterprise mode in Mito AI provides:

1. **LLM Model Lockdown**: AI calls ONLY go to IT-approved LLM models
2. **Telemetry Elimination**: No telemetry is sent to Mito servers
3. **User Protection**: End users cannot change to unapproved LLM models

## Enabling Enterprise Mode

Enterprise mode is automatically enabled when the `mitosheet-helper-enterprise` package is installed. This package must be installed by your IT team with appropriate permissions.

```bash
pip install mitosheet-helper-enterprise
```

## LiteLLM Configuration

When enterprise mode is enabled, you can optionally configure LiteLLM to route all AI calls to your approved LLM endpoint. LiteLLM configuration is **optional** - if not configured, users can continue using the normal Mito server flow.

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
  - The first model in the list is the default model.

#### User-Controlled Variables (Set by Each End User)

- **`LITELLM_API_KEY`**: User's API key for authentication with the LiteLLM server
  - Each user sets their own API key
  - Keys are never sent to Mito servers

## Security Guarantees

1. **Defense in Depth**:
   - Backend validates all model selections (even if frontend is bypassed)
   - Frontend UI only shows approved models
   - All API calls go to LiteLLM base URL
   - If user does not set correct API key, the app will still not send requests to the Mito server, instead it will just show an error message.


2. **Telemetry Elimination**:
   - Early return in telemetry functions when enterprise mode is active
   - No analytics library calls made
   - No network requests to external telemetry servers

3. **Model Lockdown**:
   - Backend validates all model selections against approved list
   - Backend rejects model change requests for unapproved models
   - Frontend shows only approved models in model selector

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
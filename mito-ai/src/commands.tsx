/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

const MITO_AI = 'mito_ai'

export const COMMAND_MITO_AI_OPEN_CHAT = `${MITO_AI}:open-chat`
export const COMMAND_MITO_AI_PREVIEW_LATEST_CODE = `${MITO_AI}:preview-latest-code`
export const COMMAND_MITO_AI_APPLY_LATEST_CODE = `${MITO_AI}:apply-latest-code`
export const COMMAND_MITO_AI_REJECT_LATEST_CODE = `${MITO_AI}:reject-latest-code`
export const COMMAND_MITO_AI_SEND_MESSAGE = `${MITO_AI}:send-message`
export const COMMAND_MITO_AI_SEND_EXPLAIN_CODE_MESSAGE = `${MITO_AI}:send-explain-code-message`
export const COMMAND_MITO_AI_SEND_DEBUG_ERROR_MESSAGE = `${MITO_AI}:send-debug-error-message`
export const COMMAND_MITO_AI_SEND_AGENT_MESSAGE = `${MITO_AI}:send-agent-message`

export const COMMAND_MITO_AI_CELL_TOOLBAR_ACCEPT_CODE = `toolbar-button:accept-code`
export const COMMAND_MITO_AI_CELL_TOOLBAR_REJECT_CODE = `toolbar-button:reject-code`

// Beta mode commands
export const COMMAND_MITO_AI_BETA_MODE_ENABLED = `${MITO_AI}:beta-mode-enabled`

// Streamlit commands
export const previewAsStreamlit = 'mito-ai:preview-as-streamlit';

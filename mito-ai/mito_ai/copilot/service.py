# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
GitHub Copilot via HTTPS (device OAuth + copilot_internal token + SSE chat).
"""

from __future__ import annotations

import base64
import datetime as dt
import json
import logging
import os
import secrets
import threading
import time
import uuid
from enum import Enum
from typing import Any, Callable, Dict, Iterator, List, Optional, Union

import requests
import sseclient

from mito_ai.completions.models import ResponseFormatInfo
from mito_ai.copilot.crypto_util import decrypt_with_password, encrypt_with_password
from mito_ai.utils.open_ai_utils import get_open_ai_completion_function_params

log = logging.getLogger(__name__)


def _response_format_payload_for_copilot(
    model_id: str,
    response_format_info: Optional[ResponseFormatInfo],
) -> Optional[Dict[str, Any]]:
    """OpenAI-compatible response_format for Copilot chat/completions (same shape as OpenAI client)."""
    if response_format_info is None:
        return None
    params = get_open_ai_completion_function_params(
        model_id,
        [],
        True,
        response_format_info,
        force_full_json_schema_response_format=True,
    )
    return params.get("response_format")

GHE_SUBDOMAIN = os.environ.get("MITO_AI_GHE_SUBDOMAIN", "")
GH_WEB_BASE_URL = "https://github.com" if GHE_SUBDOMAIN == "" else f"https://{GHE_SUBDOMAIN}.ghe.com"
GH_REST_API_BASE_URL = (
    "https://api.github.com" if GHE_SUBDOMAIN == "" else f"https://api.{GHE_SUBDOMAIN}.ghe.com"
)

try:
    from mito_ai._version import __version__ as MITO_AI_VERSION
except ImportError:
    MITO_AI_VERSION = "0.0.0"

EDITOR_VERSION = f"Mito/{MITO_AI_VERSION}"
EDITOR_PLUGIN_VERSION = EDITOR_VERSION
USER_AGENT = EDITOR_VERSION

# Must be set by deployment (Mito-registered GitHub OAuth app for device flow).
OAUTH_CLIENT_ID = os.environ.get("MITO_AI_GITHUB_OAUTH_CLIENT_ID", "").strip()

MACHINE_ID = secrets.token_hex(33)[0:65]

API_ENDPOINT = "https://api.githubcopilot.com"
PROXY_ENDPOINT = "https://copilot-proxy.githubusercontent.com"
TOKEN_REFRESH_INTERVAL = 1500
ACCESS_TOKEN_THREAD_SLEEP_INTERVAL = 5
TOKEN_THREAD_SLEEP_INTERVAL = 3
TOKEN_FETCH_INTERVAL = 15

MITO_USER_DIR = os.path.join(os.path.expanduser("~"), ".jupyter", "mito")
USER_DATA_FILE = os.path.join(MITO_USER_DIR, "user-data.json")
ACCESS_TOKEN_PASSWORD = os.environ.get(
    "MITO_AI_GH_ACCESS_TOKEN_PASSWORD", "mito-ai-github-access-token-password"
)


class LoginStatus(str, Enum):
    NOT_LOGGED_IN = "NOT_LOGGED_IN"
    ACTIVATING_DEVICE = "ACTIVATING_DEVICE"
    LOGGING_IN = "LOGGING_IN"
    LOGGED_IN = "LOGGED_IN"


github_auth: Dict[str, Any] = {
    "verification_uri": None,
    "user_code": None,
    "device_code": None,
    "access_token": None,
    "status": LoginStatus.NOT_LOGGED_IN,
    "token": None,
    "token_expires_at": dt.datetime.now(),
}

stop_requested = False
_get_access_code_thread: Optional[threading.Thread] = None
_get_token_thread: Optional[threading.Thread] = None
_last_token_fetch_time = dt.datetime.now() + dt.timedelta(seconds=-TOKEN_FETCH_INTERVAL)
_remember_github_access_token = False
_github_access_token_provided: Optional[str] = None

_login_status_listeners_enabled = False


def set_login_status_push_enabled(enabled: bool) -> None:
    global _login_status_listeners_enabled
    _login_status_listeners_enabled = enabled


def _emit_login_status_change() -> None:
    if not _login_status_listeners_enabled:
        return
    try:
        from mito_ai.copilot import ws_notifier

        st = (
            github_auth["status"].value
            if isinstance(github_auth["status"], LoginStatus)
            else str(github_auth["status"])
        )
        payload: Dict[str, Any] = {"status": st}
        if github_auth["status"] is LoginStatus.ACTIVATING_DEVICE:
            payload["verification_uri"] = github_auth.get("verification_uri")
            payload["user_code"] = github_auth.get("user_code")
        ws_notifier.notify_github_copilot_login_status(payload)
    except Exception:
        log.debug("Copilot login status push skipped", exc_info=True)


def get_login_status() -> Dict[str, Any]:
    response: Dict[str, Any] = {
        "status": github_auth["status"].value
        if isinstance(github_auth["status"], LoginStatus)
        else str(github_auth["status"]),
        "store_github_access_token": get_store_github_access_token_preference(),
    }
    if github_auth["status"] is LoginStatus.ACTIVATING_DEVICE:
        response.update(
            {
                "verification_uri": github_auth["verification_uri"],
                "user_code": github_auth["user_code"],
            }
        )
    return response


def read_stored_github_access_token() -> Optional[str]:
    try:
        if os.path.exists(USER_DATA_FILE):
            with open(USER_DATA_FILE, "r", encoding="utf-8") as f:
                user_data = json.load(f)
        else:
            user_data = {}
        b64 = user_data.get("github_access_token")
        if b64 is None:
            return None
        raw = base64.b64decode(b64.encode("utf-8"))
        return decrypt_with_password(ACCESS_TOKEN_PASSWORD, raw).decode("utf-8")
    except Exception as e:
        log.error("Failed to read GitHub access token: %s", e)
        return None


def write_github_access_token(access_token: str) -> bool:
    try:
        enc = encrypt_with_password(ACCESS_TOKEN_PASSWORD, access_token.encode("utf-8"))
        b64 = base64.b64encode(enc).decode("utf-8")
        os.makedirs(MITO_USER_DIR, exist_ok=True)
        user_data: Dict[str, Any] = {}
        if os.path.exists(USER_DATA_FILE):
            with open(USER_DATA_FILE, "r", encoding="utf-8") as f:
                user_data = json.load(f)
        user_data["github_access_token"] = b64
        with open(USER_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(user_data, f, indent=2)
        return True
    except Exception as e:
        log.error("Failed to write GitHub access token: %s", e)
        return False


def delete_stored_github_access_token() -> bool:
    if not os.path.exists(USER_DATA_FILE):
        return False
    try:
        with open(USER_DATA_FILE, "r", encoding="utf-8") as f:
            user_data = json.load(f)
        user_data.pop("github_access_token", None)
        with open(USER_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(user_data, f, indent=2)
        return True
    except Exception as e:
        log.error("Failed to delete GitHub access token: %s", e)
        return False


def get_store_github_access_token_preference() -> bool:
    if not os.path.exists(USER_DATA_FILE):
        return False
    try:
        with open(USER_DATA_FILE, "r", encoding="utf-8") as f:
            user_data = json.load(f)
        return bool(user_data.get("store_github_access_token", False))
    except Exception:
        return False


def set_store_github_access_token_preference(store: bool) -> None:
    os.makedirs(MITO_USER_DIR, exist_ok=True)
    user_data: Dict[str, Any] = {}
    if os.path.exists(USER_DATA_FILE):
        with open(USER_DATA_FILE, "r", encoding="utf-8") as f:
            user_data = json.load(f)
    user_data["store_github_access_token"] = store
    with open(USER_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(user_data, f, indent=2)
    if store:
        tok = github_auth.get("access_token")
        if tok:
            write_github_access_token(tok)
    else:
        delete_stored_github_access_token()


def login_with_existing_credentials(store_access_token: Optional[bool] = None) -> None:
    global _github_access_token_provided, _remember_github_access_token

    if github_auth["status"] is not LoginStatus.NOT_LOGGED_IN:
        return

    if store_access_token is None:
        store_access_token = get_store_github_access_token_preference()

    if store_access_token:
        _github_access_token_provided = read_stored_github_access_token()
        _remember_github_access_token = True
    else:
        delete_stored_github_access_token()
        _github_access_token_provided = None
        _remember_github_access_token = False

    if _github_access_token_provided is not None:
        github_auth["access_token"] = _github_access_token_provided
        get_token()
        wait_for_tokens()


def login() -> Optional[Dict[str, Any]]:
    return get_device_verification_info()


def logout() -> Dict[str, Any]:
    global _github_access_token_provided
    _github_access_token_provided = None
    github_auth.update(
        {
            "verification_uri": None,
            "user_code": None,
            "device_code": None,
            "access_token": None,
            "status": LoginStatus.NOT_LOGGED_IN,
            "token": None,
        }
    )
    _emit_login_status_change()
    return get_login_status()


def handle_stop_request() -> None:
    global stop_requested
    stop_requested = True


def get_device_verification_info() -> Optional[Dict[str, Any]]:
    global github_auth
    if not OAUTH_CLIENT_ID:
        log.error("MITO_AI_GITHUB_OAUTH_CLIENT_ID is not set; cannot start GitHub device login.")
        return None
    # GitHub expects application/x-www-form-urlencoded (not JSON); otherwise user_code may be missing.
    form_body = {"client_id": OAUTH_CLIENT_ID, "scope": "read:user"}
    try:
        resp = requests.post(
            f"{GH_WEB_BASE_URL}/login/device/code",
            headers={
                "accept": "application/json",
                "editor-version": EDITOR_VERSION,
                "editor-plugin-version": EDITOR_PLUGIN_VERSION,
                "user-agent": USER_AGENT,
                "accept-encoding": "gzip,deflate,br",
            },
            data=form_body,
            timeout=60,
        )
        resp_json = resp.json()
        if resp.status_code != 200 or resp_json.get("error"):
            err = resp_json.get("error_description") or resp_json.get("error") or resp.text
            log.error(
                "GitHub device code request failed [%s]: %s",
                resp.status_code,
                err,
            )
            return None
        user_code = resp_json.get("user_code")
        device_code = resp_json.get("device_code")
        if not user_code or not device_code:
            log.error("GitHub device code response missing user_code or device_code: %s", resp_json)
            return None
        github_auth["verification_uri"] = resp_json.get("verification_uri")
        github_auth["user_code"] = user_code
        github_auth["device_code"] = device_code
        github_auth["status"] = LoginStatus.ACTIVATING_DEVICE
        _emit_login_status_change()
    except Exception as e:
        log.error("Failed to get device verification info: %s", e)
        return None

    wait_for_tokens()
    return get_login_status()


def _wait_for_user_access_token_thread_func() -> None:
    global github_auth, _get_access_code_thread, _github_access_token_provided

    if _github_access_token_provided is not None and github_auth.get("device_code") is None:
        log.info("Using existing GitHub access token from disk")
        _get_access_code_thread = None
        return

    while True:
        if (
            stop_requested
            or github_auth["access_token"] is not None
            or github_auth["device_code"] is None
            or github_auth["status"] == LoginStatus.NOT_LOGGED_IN
        ):
            _get_access_code_thread = None
            break
        form_body = {
            "client_id": OAUTH_CLIENT_ID,
            "device_code": github_auth["device_code"],
            "grant_type": "urn:ietf:params:oauth:grant-type:device_code",
        }
        try:
            resp = requests.post(
                f"{GH_WEB_BASE_URL}/login/oauth/access_token",
                headers={
                    "accept": "application/json",
                    "editor-version": EDITOR_VERSION,
                    "editor-plugin-version": EDITOR_PLUGIN_VERSION,
                    "user-agent": USER_AGENT,
                    "accept-encoding": "gzip,deflate,br",
                },
                data=form_body,
                timeout=60,
            )
            resp_json = resp.json()
            access_token = resp_json.get("access_token")
            if access_token:
                github_auth["access_token"] = access_token
                get_token()
                _get_access_code_thread = None
                if _remember_github_access_token:
                    write_github_access_token(access_token)
                break
        except Exception as e:
            log.error("Failed to get access token from GitHub: %s", e)

        time.sleep(ACCESS_TOKEN_THREAD_SLEEP_INTERVAL)


def get_token() -> None:
    global github_auth, _github_access_token_provided, API_ENDPOINT, PROXY_ENDPOINT, TOKEN_REFRESH_INTERVAL
    access_token = github_auth["access_token"]
    if access_token is None:
        return

    github_auth["status"] = LoginStatus.LOGGING_IN
    _emit_login_status_change()

    try:
        resp = requests.get(
            f"{GH_REST_API_BASE_URL}/copilot_internal/v2/token",
            headers={
                "authorization": f"token {access_token}",
                "editor-version": EDITOR_VERSION,
                "editor-plugin-version": EDITOR_PLUGIN_VERSION,
                "user-agent": USER_AGENT,
            },
            timeout=60,
        )
        resp_json = resp.json()
        if resp.status_code == 401:
            _github_access_token_provided = None
            logout()
            wait_for_tokens()
            return
        if resp.status_code == 404:
            log.error(
                "GitHub Copilot token exchange returned 404. OAuth App device-flow tokens "
                "(prefix gho_) are not accepted at /copilot_internal/v2/token. Use the same "
                "GitHub Copilot CLI GitHub App client ID as other Copilot integrations: set "
                "MITO_AI_GITHUB_OAUTH_CLIENT_ID=Iv1.b507a08c87ecfe98 and restart Jupyter. "
                "See the GitHub Copilot section in mito-ai README."
            )
            return
        if resp.status_code != 200:
            log.error("Failed to get Copilot token: %s", resp_json)
            return

        token = resp_json.get("token")
        github_auth["token"] = token
        expires_at = resp_json.get("expires_at")
        if expires_at is not None:
            github_auth["token_expires_at"] = dt.datetime.fromtimestamp(expires_at)
        else:
            github_auth["token_expires_at"] = dt.datetime.now() + dt.timedelta(
                seconds=TOKEN_REFRESH_INTERVAL
            )
        github_auth["verification_uri"] = None
        github_auth["user_code"] = None
        github_auth["status"] = LoginStatus.LOGGED_IN
        _emit_login_status_change()

        endpoints = resp_json.get("endpoints", {}) or {}
        API_ENDPOINT = endpoints.get("api", API_ENDPOINT)
        PROXY_ENDPOINT = endpoints.get("proxy", PROXY_ENDPOINT)
        TOKEN_REFRESH_INTERVAL = int(resp_json.get("refresh_in", TOKEN_REFRESH_INTERVAL))
    except Exception as e:
        log.error("Failed to get token from GitHub Copilot: %s", e)


def _get_token_thread_func() -> None:
    global github_auth, _get_token_thread, _last_token_fetch_time
    while True:
        if stop_requested or github_auth["status"] == LoginStatus.NOT_LOGGED_IN:
            _get_token_thread = None
            return
        token = github_auth["token"]
        if github_auth["access_token"] is not None and (
            token is None
            or (dt.datetime.now() - github_auth["token_expires_at"]).total_seconds() > -10
        ):
            if (dt.datetime.now() - _last_token_fetch_time).total_seconds() > TOKEN_FETCH_INTERVAL:
                log.info("Refreshing GitHub Copilot token")
                get_token()
                _last_token_fetch_time = dt.datetime.now()
        time.sleep(TOKEN_THREAD_SLEEP_INTERVAL)


def wait_for_tokens() -> None:
    global _get_access_code_thread, _get_token_thread
    if _get_access_code_thread is None:
        _get_access_code_thread = threading.Thread(
            target=_wait_for_user_access_token_thread_func, daemon=True
        )
        _get_access_code_thread.start()
    if _get_token_thread is None:
        _get_token_thread = threading.Thread(target=_get_token_thread_func, daemon=True)
        _get_token_thread.start()


def generate_copilot_headers() -> Dict[str, str]:
    tok = github_auth["token"]
    if not tok:
        raise RuntimeError("Not signed in to GitHub Copilot.")
    return {
        "authorization": f"Bearer {tok}",
        "editor-version": EDITOR_VERSION,
        "editor-plugin-version": EDITOR_PLUGIN_VERSION,
        "user-agent": USER_AGENT,
        "content-type": "application/json",
        "openai-intent": "conversation-panel",
        "openai-organization": "github-copilot",
        "copilot-integration-id": "vscode-chat",
        "x-request-id": str(uuid.uuid4()),
        "vscode-sessionid": str(uuid.uuid4()),
        "vscode-machineid": MACHINE_ID,
    }


def _normalize_messages(messages: List[Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for m in messages:
        if isinstance(m, dict):
            out.append(dict(m))
        else:
            out.append(dict(m))  # type: ignore[arg-type]
    return out


def _aggregate_streaming_response(client: sseclient.SSEClient) -> Dict[str, Any]:
    final_tool_calls: List[Dict[str, Any]] = []
    final_content = ""

    def _format_llm_response() -> Dict[str, Any]:
        for tool_call in final_tool_calls:
            fn = tool_call.get("function", {})
            if "arguments" in fn and fn["arguments"] == "":
                fn["arguments"] = "{}"
        tool_calls = [
            tc
            for tc in final_tool_calls
            if "function" in tc and tc["function"].get("name")
        ]
        return {
            "choices": [
                {
                    "message": {
                        "tool_calls": tool_calls if tool_calls else None,
                        "content": final_content,
                        "role": "assistant",
                    }
                }
            ]
        }

    for event in client.events():
        if event.data == "[DONE]":
            return _format_llm_response()
        chunk = json.loads(event.data)
        if len(chunk.get("choices", [])) == 0:
            continue
        delta = chunk["choices"][0].get("delta", {})
        content_chunk = delta.get("content")
        if content_chunk:
            final_content += content_chunk
        for tool_call in delta.get("tool_calls") or []:
            if "index" not in tool_call:
                continue
            index = tool_call["index"]
            if index >= len(final_tool_calls):
                tc = dict(tool_call)
                if "function" in tc and "arguments" not in tc["function"]:
                    tc["function"]["arguments"] = ""
                final_tool_calls.append(tc)
            else:
                if "function" in tool_call and "arguments" in tool_call["function"]:
                    final_tool_calls[index]["function"]["arguments"] += tool_call["function"][
                        "arguments"
                    ]

    return _format_llm_response()


def chat_completions_aggregate(
    model_id: str,
    messages: List[Any],
    tools: Optional[List[Dict[str, Any]]] = None,
    tool_choice: Optional[Any] = None,
    response_format_info: Optional[ResponseFormatInfo] = None,
) -> Dict[str, Any]:
    """Blocking: full SSE read, return OpenAI-shaped result with choices[0].message."""
    headers = generate_copilot_headers()
    data: Dict[str, Any] = {
        "model": model_id,
        "messages": _normalize_messages(messages),
        "temperature": 0,
        "top_p": 1,
        "n": 1,
        "nwo": "Mito",
        "stream": True,
    }
    if tools is not None:
        data["tools"] = tools
    if tool_choice is not None:
        data["tool_choice"] = tool_choice
    rf = _response_format_payload_for_copilot(model_id, response_format_info)
    if rf is not None:
        data["response_format"] = rf

    resp = requests.post(
        f"{API_ENDPOINT}/chat/completions",
        headers=headers,
        json=data,
        stream=True,
        timeout=120,
    )
    if resp.status_code != 200:
        msg = f"GitHub Copilot error [{resp.status_code}]: {resp.text}"
        log.error(msg)
        if resp.status_code == 400 and "model_not_supported" in resp.text:
            msg += (
                " Try another model in the Mito model picker (gpt-4o is a safe default), "
                "set MITO_AI_COPILOT_CHAT_MODEL_IDS to a comma-separated allowlist, "
                "and enable models at https://github.com/settings/copilot/features ."
            )
        raise RuntimeError(msg)
    client = sseclient.SSEClient(resp)
    return _aggregate_streaming_response(client)


def chat_completions_stream_text_deltas(
    model_id: str,
    messages: List[Any],
    cancel_check: Optional[Callable[[], bool]] = None,
    response_format_info: Optional[ResponseFormatInfo] = None,
) -> Iterator[str]:
    """Yield assistant text deltas from SSE (blocking iterator; run in a thread)."""
    headers = generate_copilot_headers()
    data: Dict[str, Any] = {
        "model": model_id,
        "messages": _normalize_messages(messages),
        "temperature": 0,
        "top_p": 1,
        "n": 1,
        "nwo": "Mito",
        "stream": True,
    }
    rf = _response_format_payload_for_copilot(model_id, response_format_info)
    if rf is not None:
        data["response_format"] = rf

    resp = requests.post(
        f"{API_ENDPOINT}/chat/completions",
        headers=headers,
        json=data,
        stream=True,
        timeout=120,
    )
    if resp.status_code != 200:
        msg = f"GitHub Copilot error [{resp.status_code}]: {resp.text}"
        log.error(msg)
        if resp.status_code == 400 and "model_not_supported" in resp.text:
            msg += (
                " Try another model (e.g. gpt-4o), adjust MITO_AI_COPILOT_CHAT_MODEL_IDS, "
                "or enable models at https://github.com/settings/copilot/features ."
            )
        raise RuntimeError(msg)
    client = sseclient.SSEClient(resp)
    for event in client.events():
        if cancel_check and cancel_check():
            break
        if event.data == "[DONE]":
            break
        chunk = json.loads(event.data)
        if not chunk.get("choices"):
            continue
        delta = chunk["choices"][0].get("delta", {})
        piece = delta.get("content")
        if piece:
            yield piece


def ensure_logged_in_for_completion() -> None:
    if github_auth.get("status") is not LoginStatus.LOGGED_IN or not github_auth.get("token"):
        raise RuntimeError(
            "GitHub Copilot is not connected. Sign in via Mito AI settings (device code flow)."
        )

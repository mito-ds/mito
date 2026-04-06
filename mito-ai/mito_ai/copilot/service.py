# Copyright (c) Saga Inc.
# Distributed under the terms of the GNU Affero General Public License v3.0 License.

"""
GitHub Copilot via HTTPS (device OAuth + copilot_internal token + SSE chat).
"""

from __future__ import annotations

import datetime as dt
import logging
import os
import secrets
import threading
import time
import uuid
from enum import Enum
from typing import Any, Dict, List, Optional

import requests

log = logging.getLogger(__name__)

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

# GitHub Copilot CLI GitHub App (device flow)
OAUTH_CLIENT_ID = "Iv1.b507a08c87ecfe98"

MACHINE_ID = secrets.token_hex(33)[0:65]

API_ENDPOINT = "https://api.githubcopilot.com"
PROXY_ENDPOINT = "https://copilot-proxy.githubusercontent.com"
TOKEN_REFRESH_INTERVAL = 1500
ACCESS_TOKEN_THREAD_SLEEP_INTERVAL = 5
TOKEN_THREAD_SLEEP_INTERVAL = 3
TOKEN_FETCH_INTERVAL = 15



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

# Filled by GET {API_ENDPOINT}/models after sign-in (thread); used to filter the Mito model list.
_copilot_api_models_cache: Optional[List[Dict[str, Any]]] = None
_copilot_models_cache_lock = threading.Lock()
_last_copilot_models_fetch_monotonic: float = -1e9
COPILOT_MODELS_FETCH_MIN_INTERVAL_SEC = 90.0

# Total capacity (input + output) a model must support.
MIN_CONTEXT_WINDOW_TOKENS = 128_000
# Max input tokens (system prompt, conversation, code context) a model must accept.
MIN_PROMPT_TOKENS = 128_000

_get_access_code_thread: Optional[threading.Thread] = None
_get_token_thread: Optional[threading.Thread] = None
_last_token_fetch_time = dt.datetime.now() + dt.timedelta(seconds=-TOKEN_FETCH_INTERVAL)

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
        if github_auth["status"] is LoginStatus.LOGGED_IN:
            cached = get_cached_copilot_api_model_ids()
            if cached is not None:
                payload["available_chat_models"] = cached
        ws_notifier.notify_github_copilot_login_status(payload)
    except Exception:
        log.debug("Copilot login status push skipped", exc_info=True)


def get_login_status() -> Dict[str, Any]:
    response: Dict[str, Any] = {
        "status": github_auth["status"].value
        if isinstance(github_auth["status"], LoginStatus)
        else str(github_auth["status"]),
    }
    if github_auth["status"] is LoginStatus.ACTIVATING_DEVICE:
        response.update(
            {
                "verification_uri": github_auth["verification_uri"],
                "user_code": github_auth["user_code"],
            }
        )
    if github_auth["status"] is LoginStatus.LOGGED_IN:
        cached_models = get_cached_copilot_api_model_ids()
        if cached_models is not None:
            response["available_chat_models"] = cached_models
    return response


def login() -> Optional[Dict[str, Any]]:
    return get_device_verification_info()


def logout() -> Dict[str, Any]:
    global _last_copilot_models_fetch_monotonic, _copilot_api_models_cache
    with _copilot_models_cache_lock:
        _copilot_api_models_cache = None
    _last_copilot_models_fetch_monotonic = -1e9
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
    global github_auth, _get_access_code_thread

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
                break
        except Exception as e:
            log.error("Failed to get access token from GitHub: %s", e)

        time.sleep(ACCESS_TOKEN_THREAD_SLEEP_INTERVAL)


def get_token() -> None:
    global github_auth, API_ENDPOINT, PROXY_ENDPOINT, TOKEN_REFRESH_INTERVAL
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
            logout()
            wait_for_tokens()
            return
        if resp.status_code == 404:
            log.error(
                "GitHub Copilot token exchange returned 404. If GitHub’s API changed or the "
                "access token is not from the Copilot CLI GitHub App device flow, "
                "/copilot_internal/v2/token may reject it. See the GitHub Copilot section in mito-ai README."
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
        schedule_refresh_copilot_chat_models()
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


def get_cached_copilot_api_model_ids() -> Optional[List[str]]:
    """Model ids from last successful GET /models (no copilot/ prefix), or None if not fetched yet."""
    with _copilot_models_cache_lock:
        if _copilot_api_models_cache is None:
            return None
        return [
            m.get("id") or m.get("name") or ""
            for m in _copilot_api_models_cache
            if m.get("id") or m.get("name")
        ]


def _get_model_limits(model: Dict[str, Any]) -> Dict[str, Optional[int]]:
    """Extract token limits from a Copilot /models response object."""
    caps = model.get("capabilities") or {}
    limits = caps.get("limits") or {}
    return {
        "max_context_window_tokens": limits.get("max_context_window_tokens"),
        "max_prompt_tokens": limits.get("max_prompt_tokens"),
    }


def _parse_model_objects(body: Any) -> List[Dict[str, Any]]:
    """Extract model dicts from the Copilot /models JSON response."""
    items: Optional[List[Any]] = None
    if isinstance(body, list):
        items = body
    elif isinstance(body, dict):
        for key in ("data", "models"):
            inner = body.get(key)
            if isinstance(inner, list):
                items = inner
                break
    if items is None:
        return []
    return [item for item in items if isinstance(item, dict) and (item.get("id") or item.get("name"))]


def fetch_copilot_models_blocking() -> Optional[List[Dict[str, Any]]]:
    """
    Query GitHub Copilot for models available to this account (Bearer copilot token).
    Filters to models with context window >= MIN_CONTEXT_WINDOW_TOKENS and
    prompt tokens >= MIN_PROMPT_TOKENS.
    Returns None on failure; caller should not clear the cache when None.
    """
    if github_auth.get("status") is not LoginStatus.LOGGED_IN or not github_auth.get("token"):
        return None
    try:
        headers = generate_copilot_headers()
        url = f"{API_ENDPOINT.rstrip('/')}/models"
        resp = requests.get(url, headers=headers, timeout=30)
    except Exception as e:
        log.warning("Copilot GET /models request failed: %s", e)
        return None
    if resp.status_code != 200:
        log.warning(
            "Copilot GET /models failed [%s]: %s",
            resp.status_code,
            (resp.text or "")[:500],
        )
        return None
    try:
        body = resp.json()
    except Exception as e:
        log.warning("Copilot GET /models: invalid JSON: %s", e)
        return None
    all_models = _parse_model_objects(body)
    if not all_models:
        log.warning("Copilot GET /models: could not parse any model objects from response")
        return None

    filtered = []
    for m in all_models:
        limits = _get_model_limits(m)
        ctx = limits["max_context_window_tokens"] or 0
        prompt = limits["max_prompt_tokens"] or 0
        if ctx >= MIN_CONTEXT_WINDOW_TOKENS and prompt >= MIN_PROMPT_TOKENS:
            filtered.append(m)
    log.info(
        "Copilot GET /models: %d models total, %d after token limit filter "
        "(context >= %d, prompt >= %d)",
        len(all_models), len(filtered), MIN_CONTEXT_WINDOW_TOKENS, MIN_PROMPT_TOKENS,
    )

    # Deduplicate by id while preserving order
    seen: set = set()
    deduped: List[Dict[str, Any]] = []
    for m in filtered:
        mid = m.get("id") or m.get("name") or ""
        if mid and mid not in seen:
            seen.add(mid)
            deduped.append(m)
    return deduped


def schedule_refresh_copilot_chat_models() -> None:
    """Background fetch of /models; debounced when cache already populated (token refresh)."""

    def run() -> None:
        global _last_copilot_models_fetch_monotonic, _copilot_api_models_cache
        now = time.monotonic()
        with _copilot_models_cache_lock:
            has_cache = _copilot_api_models_cache is not None
        if has_cache and (now - _last_copilot_models_fetch_monotonic) < COPILOT_MODELS_FETCH_MIN_INTERVAL_SEC:
            return
        models = fetch_copilot_models_blocking()
        if models is None:
            return
        if len(models) == 0:
            log.warning("Copilot GET /models returned no qualifying models; keeping existing cache")
            return
        with _copilot_models_cache_lock:
            _copilot_api_models_cache = models
        _last_copilot_models_fetch_monotonic = now
        _emit_login_status_change()

    threading.Thread(target=run, daemon=True).start()



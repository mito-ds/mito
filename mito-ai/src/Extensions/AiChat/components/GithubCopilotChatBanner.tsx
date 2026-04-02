/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchGithubCopilotLoginStatus,
  logoutGithubCopilot,
  setGithubCopilotStoreTokenPreference,
  startGithubCopilotDeviceLogin
} from '../../../restAPI/RestAPI';
import type { CompletionWebsocketClient } from '../../../websockets/completions/CompletionsWebsocketClient';
import type {
  CompleterMessage,
  IGithubCopilotLoginStatus
} from '../../../websockets/completions/CompletionModels';
import '../../../../style/GithubCopilotBanner.css';

type CopilotUiState = {
  enabled: boolean;
  status: string;
  verification_uri?: string;
  user_code?: string;
  store_github_access_token: boolean;
};

const DEFAULT_STATE: CopilotUiState = {
  enabled: false,
  status: 'NOT_LOGGED_IN',
  store_github_access_token: false
};

interface IGithubCopilotChatBannerProps {
  websocketClient: CompletionWebsocketClient;
}

/**
 * Shown in the chat taskpane when the server has GitHub Copilot mode (helper package installed).
 */
export const GithubCopilotChatBanner: React.FC<IGithubCopilotChatBannerProps> = ({
  websocketClient
}) => {
  const [state, setState] = useState<CopilotUiState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const applyPayload = useCallback((payload: unknown) => {
    if (!payload || typeof payload !== 'object') {
      return;
    }
    const p = payload as Record<string, unknown>;
    setState(prev => ({
      ...prev,
      status: typeof p.status === 'string' ? p.status : prev.status,
      verification_uri:
        typeof p.verification_uri === 'string' ? p.verification_uri : undefined,
      user_code: typeof p.user_code === 'string' ? p.user_code : undefined,
      store_github_access_token:
        typeof p.store_github_access_token === 'boolean'
          ? p.store_github_access_token
          : prev.store_github_access_token
    }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const initial = await fetchGithubCopilotLoginStatus();
      if (cancelled) {
        return;
      }
      if (!initial) {
        setState(DEFAULT_STATE);
        return;
      }
      setState({
        enabled: true,
        status: initial.status,
        verification_uri: initial.verification_uri,
        user_code: initial.user_code,
        store_github_access_token: Boolean(initial.store_github_access_token)
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!state.enabled) {
      return;
    }

    const onWs = (_c: CompletionWebsocketClient, msg: CompleterMessage): void => {
      if (msg.type === 'github_copilot_login_status') {
        const m = msg as IGithubCopilotLoginStatus;
        applyPayload({
          status: m.status,
          verification_uri: m.verification_uri,
          user_code: m.user_code
        });
      }
    };

    websocketClient.messages.connect(onWs, null);
    return () => {
      websocketClient.messages.disconnect(onWs, null);
    };
  }, [state.enabled, websocketClient, applyPayload]);

  if (!state.enabled) {
    return null;
  }

  const onSignIn = async (): Promise<void> => {
    setLoginError(null);
    setLoading(true);
    try {
      const res = await startGithubCopilotDeviceLogin();
      if (res && 'error' in res) {
        setLoginError(res.error);
        return;
      }
      // Use POST body first so user_code shows immediately (same payload as login-status).
      if (res && 'status' in res) {
        setState(s => ({
          ...s,
          enabled: true,
          status: res.status,
          verification_uri: res.verification_uri,
          user_code: res.user_code,
          store_github_access_token:
            typeof res.store_github_access_token === 'boolean'
              ? res.store_github_access_token
              : s.store_github_access_token
        }));
      }
      const latest = await fetchGithubCopilotLoginStatus();
      if (latest) {
        setState(s => ({
          ...s,
          enabled: true,
          status: latest.status,
          verification_uri: latest.verification_uri,
          user_code: latest.user_code,
          store_github_access_token: Boolean(latest.store_github_access_token)
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await logoutGithubCopilot();
      applyPayload(res ?? { status: 'NOT_LOGGED_IN' });
    } finally {
      setLoading(false);
    }
  };

  const onToggleStore = async (store: boolean): Promise<void> => {
    const ok = await setGithubCopilotStoreTokenPreference(store);
    if (ok) {
      setState(s => ({ ...s, store_github_access_token: store }));
    }
  };

  return (
    <div className="github-copilot-banner">
      <div className="github-copilot-banner-title">GitHub Copilot</div>
      {state.status === 'LOGGED_IN' ? (
        <div className="github-copilot-banner-row">
          <span className="github-copilot-banner-ok">Signed in</span>
          <button
            type="button"
            className="github-copilot-banner-link"
            disabled={loading}
            onClick={() => void onLogout()}
          >
            Sign out
          </button>
        </div>
      ) : null}
      {state.status === 'NOT_LOGGED_IN' ? (
        <div className="github-copilot-banner-col">
          <p className="github-copilot-banner-hint">
            Sign in with GitHub to use Copilot models in this deployment.
          </p>
          <label className="github-copilot-banner-check">
            <input
              type="checkbox"
              checked={state.store_github_access_token}
              onChange={e => void onToggleStore(e.target.checked)}
            />
            Remember GitHub sign-in on this machine (encrypted local file)
          </label>
          {loginError ? <p className="github-copilot-banner-error">{loginError}</p> : null}
          <button
            type="button"
            className="github-copilot-banner-primary"
            disabled={loading}
            onClick={() => void onSignIn()}
          >
            {loading ? 'Starting…' : 'Sign in with GitHub'}
          </button>
        </div>
      ) : null}
      {state.status === 'ACTIVATING_DEVICE' ? (
        <div className="github-copilot-banner-col">
          <p className="github-copilot-banner-hint">
            Open GitHub and enter this code to authorize Copilot:
          </p>
          {state.user_code ? (
            <div className="github-copilot-banner-code">{state.user_code}</div>
          ) : null}
          {state.verification_uri ? (
            <a
              href={state.verification_uri}
              target="_blank"
              rel="noopener noreferrer"
              className="github-copilot-banner-link"
            >
              Open GitHub device login
            </a>
          ) : null}
        </div>
      ) : null}
      {state.status === 'LOGGING_IN' ? (
        <p className="github-copilot-banner-hint">Finishing sign-in with GitHub Copilot…</p>
      ) : null}
    </div>
  );
};

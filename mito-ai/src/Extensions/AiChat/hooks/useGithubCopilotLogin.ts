/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchGithubCopilotLoginStatus,
  logoutGithubCopilot,
  startGithubCopilotDeviceLogin
} from '../../../restAPI/RestAPI';
import type { CompletionWebsocketClient } from '../../../websockets/completions/CompletionsWebsocketClient';
import type {
  CompleterMessage,
  IGithubCopilotLoginStatus
} from '../../../websockets/completions/CompletionModels';

type CopilotUiState = {
  enabled: boolean;
  status: string;
  verification_uri?: string;
  user_code?: string;
};

const DEFAULT_STATE: CopilotUiState = {
  enabled: false,
  status: 'NOT_LOGGED_IN',
};

/**
 * GitHub Copilot device-login state when mito-ai-helper-github-copilot is installed.
 */
export const useGithubCopilotLogin = (
  websocketClient: CompletionWebsocketClient
): {
  enabled: boolean;
  status: string;
  verification_uri?: string;
  user_code?: string;
  loading: boolean;
  loginError: string | null;
  copilotBlocksChat: boolean;
  onSignIn: () => Promise<void>;
  onLogout: () => Promise<void>;
} => {
  const [state, setState] = useState<CopilotUiState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const previousStatusRef = useRef<string>(DEFAULT_STATE.status);

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
    }));
  }, []);

  const applyServerStatus = useCallback((latest: {
    status: string;
    verification_uri?: string;
    user_code?: string;
    available_chat_models?: string[];
  }) => {
    setState(s => ({
      ...s,
      enabled: true,
      status: latest.status,
      verification_uri: latest.verification_uri,
      user_code: latest.user_code,
    }));

    // Refresh model selector as soon as sign-in completes, even if /models payload arrives later.
    const transitionedToLoggedIn =
      previousStatusRef.current !== 'LOGGED_IN' && latest.status === 'LOGGED_IN';
    if (
      transitionedToLoggedIn ||
      (latest.available_chat_models && latest.available_chat_models.length > 0)
    ) {
      window.dispatchEvent(new CustomEvent('mito-github-copilot-models-updated'));
    }
    previousStatusRef.current = latest.status;
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
      applyServerStatus(initial);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyServerStatus]);

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
        if (m.available_chat_models && m.available_chat_models.length > 0) {
          window.dispatchEvent(new CustomEvent('mito-github-copilot-models-updated'));
        }
        previousStatusRef.current = m.status;
      }
    };

    websocketClient.messages.connect(onWs, null);
    return () => {
      websocketClient.messages.disconnect(onWs, null);
    };
  }, [state.enabled, websocketClient, applyPayload]);

  // Poll while waiting for device login completion. This avoids getting stuck
  // on ACTIVATING_DEVICE if websocket pushes are delayed or missed.
  useEffect(() => {
    if (!state.enabled || state.status === 'LOGGED_IN') {
      return;
    }

    const intervalId = window.setInterval(() => {
      void (async () => {
        const latest = await fetchGithubCopilotLoginStatus();
        if (!latest) {
          return;
        }
        applyServerStatus(latest);
      })();
    }, 1500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [state.enabled, state.status, applyServerStatus]);

  const onSignIn = useCallback(async (): Promise<void> => {
    setLoginError(null);
    setLoading(true);
    try {
      const res = await startGithubCopilotDeviceLogin();
      if (res && 'error' in res) {
        setLoginError(res.error);
        return;
      }
      if (res && 'status' in res) {
        setState(s => ({
          ...s,
          enabled: true,
          status: res.status,
          verification_uri: res.verification_uri,
          user_code: res.user_code,
        }));
      }
      const latest = await fetchGithubCopilotLoginStatus();
      if (latest) {
        applyServerStatus(latest);
      }
    } finally {
      setLoading(false);
    }
  }, [applyServerStatus]);

  const onLogout = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await logoutGithubCopilot();
      applyPayload(res ?? { status: 'NOT_LOGGED_IN' });
    } finally {
      setLoading(false);
    }
  }, [applyPayload]);

  const copilotBlocksChat = state.enabled && state.status !== 'LOGGED_IN';

  return {
    enabled: state.enabled,
    status: state.status,
    verification_uri: state.verification_uri,
    user_code: state.user_code,
    loading,
    loginError,
    copilotBlocksChat,
    onSignIn,
    onLogout,
  };
};

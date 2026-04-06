/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  fetchGithubCopilotLoginStatus,
  logoutGithubCopilot,
  startGithubCopilotDeviceLogin
} from '../../../restAPI/RestAPI';
import '../../../../style/GithubCopilotBanner.css';

type PanelState = {
  visible: boolean;
  status: string;
  verification_uri?: string;
  user_code?: string;
};

const INITIAL: PanelState = {
  visible: false,
  status: 'NOT_LOGGED_IN',
};

/**
 * Renders only when the server exposes GitHub Copilot REST routes (helper package installed).
 */
export const GithubCopilotSettingsPanel = (): JSX.Element | null => {
  const [state, setState] = useState<PanelState>(INITIAL);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    const data = await fetchGithubCopilotLoginStatus();
    if (!data) {
      setState(INITIAL);
      return;
    }
    setState({
      visible: true,
      status: data.status,
      verification_uri: data.verification_uri,
      user_code: data.user_code,
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!state.visible) {
    return null;
  }

  const onSignIn = async (): Promise<void> => {
    setErr(null);
    setBusy(true);
    try {
      const res = await startGithubCopilotDeviceLogin();
      if (res && 'error' in res) {
        setErr(res.error);
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const onLogout = async (): Promise<void> => {
    setBusy(true);
    try {
      await logoutGithubCopilot();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="subscription-page-card" style={{ marginBottom: 16 }}>
      <div className="subscription-page-card-content">
        <h3 className="subscription-page-section-title">GitHub Copilot</h3>
        <p className="github-copilot-banner-hint" style={{ marginBottom: 10 }}>
          This server uses GitHub Copilot for Mito AI. Sign in with a GitHub account that has Copilot.
        </p>
        {state.status === 'LOGGED_IN' ? (
          <div className="github-copilot-banner-row">
            <span className="github-copilot-banner-ok">Signed in</span>
            <button
              type="button"
              className="github-copilot-banner-link"
              disabled={busy}
              onClick={() => void onLogout()}
            >
              Sign out
            </button>
          </div>
        ) : null}
        {state.status === 'NOT_LOGGED_IN' ? (
          <div className="github-copilot-banner-col">
            {err ? <p className="github-copilot-banner-error">{err}</p> : null}
            <button
              type="button"
              className="github-copilot-banner-primary"
              disabled={busy}
              onClick={() => void onSignIn()}
            >
              {busy ? 'Starting…' : 'Sign in with GitHub'}
            </button>
          </div>
        ) : null}
        {state.status === 'ACTIVATING_DEVICE' ? (
          <div className="github-copilot-banner-col">
            <p className="github-copilot-banner-hint">Enter this code on GitHub:</p>
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
          <p className="github-copilot-banner-hint">Completing sign-in…</p>
        ) : null}
      </div>
    </div>
  );
};

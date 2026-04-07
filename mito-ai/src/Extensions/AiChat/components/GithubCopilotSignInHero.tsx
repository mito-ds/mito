/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React, { useEffect, useState } from 'react';
import '../../../../style/GithubCopilotSignInHero.css';
import CopyIcon from '../../../icons/CopyIcon';

/** Simple GitHub-style mark (octocat-inspired silhouette, geometric). */
const GitHubMarkIcon = (): JSX.Element => (
  <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="currentColor"
      d="M12 2C6.48 2 2 6.58 2 12.26c0 4.5 2.87 8.32 6.84 9.67.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.1-1.5-1.1-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.67.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.32 9.32 0 0 1 12 6.81c.85.004 1.71.12 2.51.35 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.8 0 .27.18.59.69.48A10.02 10.02 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
    />
  </svg>
);

export interface IGithubCopilotSignInHeroProps {
  variant?: 'full' | 'compact';
  status: string;
  verification_uri?: string;
  user_code?: string;
  loading: boolean;
  loginError: string | null;
  onSignIn: () => Promise<void>;
}

/**
 * Prominent GitHub-style sign-in for Copilot when the helper package is installed.
 */
export const GithubCopilotSignInHero: React.FC<IGithubCopilotSignInHeroProps> = ({
  variant = 'full',
  status,
  verification_uri,
  user_code,
  loading,
  loginError,
  onSignIn,
}) => {
  const [copyCodeButtonText, setCopyCodeButtonText] = useState('Copy code');

  useEffect(() => {
    if (copyCodeButtonText === 'Copy code') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyCodeButtonText('Copy code');
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyCodeButtonText]);

  const handleCopyCode = async (): Promise<void> => {
    if (!user_code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(user_code);
      setCopyCodeButtonText('Copied!');
    } catch (_error) {
      setCopyCodeButtonText('Copy failed');
    }
  };

  const rootClass =
    variant === 'compact'
      ? 'github-copilot-sso-hero github-copilot-sso-hero--compact'
      : 'github-copilot-sso-hero';

  return (
    <div className={rootClass} data-testid="github-copilot-sign-in-hero">
      <div className="github-copilot-sso-card">
        <div className="github-copilot-sso-mark" style={{ color: '#1f2328' }}>
          <GitHubMarkIcon />
        </div>
        <h2 className="github-copilot-sso-title">Sign in with GitHub</h2>
        <p className="github-copilot-sso-subtitle">
          This deployment uses GitHub Copilot for Mito AI. Sign in with the GitHub account that has
          Copilot to start chatting.
        </p>

        {status === 'NOT_LOGGED_IN' ? (
          <>
            <button
              type="button"
              className="github-copilot-sso-btn"
              disabled={loading}
              onClick={() => void onSignIn()}
            >
              {loading ? 'Connecting…' : 'Sign in with GitHub'}
            </button>
            {loginError ? <p className="github-copilot-sso-error">{loginError}</p> : null}
          </>
        ) : null}

        {status === 'ACTIVATING_DEVICE' ? (
          <div>
            <p className="github-copilot-sso-hint">
              Open GitHub and enter this code to authorize Copilot:
            </p>
            {user_code ? (
              <div className="github-copilot-sso-code">
                <span className="github-copilot-sso-code-text">{user_code}</span>
                <button
                  type="button"
                  className="github-copilot-sso-copy-code-icon-btn"
                  onClick={() => void handleCopyCode()}
                  title={copyCodeButtonText}
                  aria-label={copyCodeButtonText}
                >
                  <CopyIcon />
                </button>
              </div>
            ) : null}
            {verification_uri ? (
              <a
                href={verification_uri}
                target="_blank"
                rel="noopener noreferrer"
                className="github-copilot-sso-link"
              >
                Open GitHub device login
              </a>
            ) : null}
          </div>
        ) : null}

        {status === 'LOGGING_IN' ? (
          <p className="github-copilot-sso-hint">Finishing sign-in with GitHub…</p>
        ) : null}
      </div>
    </div>
  );
};

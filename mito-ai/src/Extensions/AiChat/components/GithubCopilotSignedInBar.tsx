/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '../../../../style/GithubCopilotBanner.css';

interface IGithubCopilotSignedInBarProps {
  loading: boolean;
  onLogout: () => Promise<void>;
}

/**
 * Compact signed-in row when GitHub Copilot is active and authenticated.
 */
export const GithubCopilotSignedInBar: React.FC<IGithubCopilotSignedInBarProps> = ({
  loading,
  onLogout
}) => {
  return (
    <div className="github-copilot-banner">
      <div className="github-copilot-banner-title">GitHub Copilot</div>
      <div className="github-copilot-banner-row">
        <span className="github-copilot-banner-ok">Signed in with GitHub</span>
        <button
          type="button"
          className="github-copilot-banner-link"
          disabled={loading}
          onClick={() => void onLogout()}
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

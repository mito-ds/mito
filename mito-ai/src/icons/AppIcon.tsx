/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

const AppIcon: React.FC = () => {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1" fill="none"/>
      <rect x="4" y="4" width="3" height="3" fill="currentColor"/>
      <rect x="9" y="4" width="3" height="3" fill="currentColor"/>
      <rect x="4" y="9" width="3" height="3" fill="currentColor"/>
      <rect x="9" y="9" width="3" height="3" fill="currentColor"/>
    </svg>
  );
};

export default AppIcon;

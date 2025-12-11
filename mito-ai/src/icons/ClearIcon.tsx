/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

const ClearIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Circle with diagonal line */}
    <circle
      cx="8"
      cy="8"
      r="6"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M5 5L11 11M11 5L5 11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export default ClearIcon;


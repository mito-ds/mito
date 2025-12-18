/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

const RestartAndRunIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Square with >> inside */}
    <rect
      x="3"
      y="3"
      width="10"
      height="10"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="none"
      rx="1"
    />
    <path
      d="M6 6L8 8L6 10M9 6L11 8L9 10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export default RestartAndRunIcon;


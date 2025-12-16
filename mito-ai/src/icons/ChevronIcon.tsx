/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

interface ChevronIconProps {
  direction?: 'down' | 'up' | 'right' | 'left';
  className?: string;
  width?: string;
  height?: string;
}

const ChevronIcon: React.FC<ChevronIconProps> = ({
  direction = 'down',
  className = '',
  width = '16',
  height = '16'
}) => {
  // Calculate rotation based on direction
  const getRotation = (): string => {
    switch (direction) {
      case 'up':
        return 'rotate(180 8 8)';
      case 'right':
        return 'rotate(-90 8 8)';
      case 'left':
        return 'rotate(90 8 8)';
      case 'down':
      default:
        return 'rotate(0 8 8)';
    }
  };

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={getRotation()}
      />
    </svg>
  );
};

export default ChevronIcon;


/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

const CheckIcon: React.FC<{
    fill?: string;
    height?: string;
    width?: string;
}> = ({
    fill = '#FFFFFF',
    height = '10',
    width = '10',
}) => (
        <svg
            data-testid="check-icon" // Look for this when writing tests
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 24 24"
        >
            <path d="M9 22l-10-10.598 2.798-2.859 7.149 7.473 13.144-14.016 2.909 2.806z" fill={fill} />
        </svg>
    );

export default CheckIcon;
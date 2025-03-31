/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

const RobotHeadIcon: React.FC<{
    fill?: string;
    height?: string;
    width?: string;
}> = ({
    height = '20',
    width = '19',
}) => (
        <svg width={width} height={height} viewBox="0 0 94 76" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g fill="currentColor">
                <path d="M0.125 34.875H6.375V59.875H0.125V34.875ZM87.625 34.875V59.875H93.875V34.875H87.625ZM50.125 22.375H81.375V75.5H12.625V22.375H43.875V16.125H37.625V0.5H56.375V16.125H50.125V22.375ZM25.125 50.5H40.75V34.875H25.125V50.5ZM53.25 50.5H68.875V34.875H53.25V50.5ZM31.375 59.875V66.125H62.625V59.875H31.375Z" />
            </g>
        </svg>
    );

export default RobotHeadIcon;

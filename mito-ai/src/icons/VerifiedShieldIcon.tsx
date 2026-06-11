/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

const VerifiedShieldIcon: React.FC = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* The checkmark is cut out of the shield so the background shows through, letting the icon work on any color */}
        <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2L4 5.5V11c0 4.97 3.41 9.59 8 10.74 4.59-1.15 8-5.77 8-10.74V5.5L12 2zM10.5 14.5l-2.5-2.5-1.2 1.2 3.7 3.7 6.2-6.2-1.2-1.2-5 5z"
            fill="currentColor"
        />
    </svg>
);

export default VerifiedShieldIcon;

/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';

interface ISettingsPageHeaderProps {
    icon: React.ReactNode;
    title: string;
    children?: React.ReactNode;
}

export const SettingsPageHeader = ({ icon, title, children }: ISettingsPageHeaderProps): JSX.Element => (
    <div className="settings-header">
        <div className="settings-header-title">
            <span className="settings-header-icon" aria-hidden="true">
                {icon}
            </span>
            <h2>{title}</h2>
        </div>
        {children}
    </div>
);

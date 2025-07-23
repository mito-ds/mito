/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '../../style/IconButton.css';
import '../../style/button.css';
import { classNames } from '../utils/classNames';

interface IconButtonProps {
    icon: React.ReactNode;
    onClick: () => void;
    title: string;
    style?: React.CSSProperties;
    notificationDotType?: 'success' | 'warning' | 'danger' | null;
    className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, title, style, notificationDotType = null, className }) => {

    return (
        <button className={classNames("icon-button", className)} onClick={onClick} title={title} style={style}>
            {icon}
            {notificationDotType && <div className={`notification-dot notification-dot-${notificationDotType}`}></div>}
        </button>
    )
}

export default IconButton;
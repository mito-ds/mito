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
}

const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, title, style }) => {

    return (
        <button className={classNames("icon-button")} onClick={onClick} title={title} style={style}>
            {icon}
        </button>
    )
}

export default IconButton;
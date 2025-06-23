/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '../../style/button.css';
import '../../style/ToggleButton.css';
import { classNames } from '../utils/classNames';

export interface ToggleButtonProps {
    leftText: string;
    rightText: string;
    leftTooltip?: string;
    rightTooltip?: string;
    leftIcon?: React.FC<{ fill?: string; height?: string; width?: string; }>;
    rightIcon?: React.FC<{ fill?: string; height?: string; width?: string; }>;
    isLeftSelected: boolean;
    onChange: (isLeftSelected: boolean) => void;
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ 
    leftText, 
    rightText, 
    leftTooltip,
    rightTooltip,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    isLeftSelected, 
    onChange, 
}) => {
    return (
        <div className={classNames(
            "toggle-button-container",
        )}>
            <button 
                className={classNames(
                    "toggle-button-half",
                    "button-base",
                    isLeftSelected ? 'selected' : 'unselected'
                )}
                onClick={() => onChange(true)}
                title={leftTooltip}
            >
                {LeftIcon && <LeftIcon width="16px" height="16px" />}
                {leftText}
            </button>
            <button 
                className={classNames(
                    "toggle-button-half",
                    "button-base",
                    !isLeftSelected ? 'selected' : 'unselected'
                )}
                onClick={() => onChange(false)}
                title={rightTooltip}
            >
                {RightIcon && <RightIcon width="16px" height="16px" />}
                {rightText}
            </button>
        </div>
    );
};

export default ToggleButton; 
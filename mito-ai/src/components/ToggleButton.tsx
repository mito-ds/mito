import React from 'react';
import '../../style/button.css';
import '../../style/ToggleButton.css';
import { classNames } from '../utils/classNames';

export interface ToggleButtonProps {
    leftText: string;
    rightText: string;
    leftIcon?: React.FC<{ fill?: string; height?: string; width?: string; }>;
    rightIcon?: React.FC<{ fill?: string; height?: string; width?: string; }>;
    isLeftSelected: boolean;
    onChange: (isLeftSelected: boolean) => void;
    title: string;
    variant: 'green' | 'red' | 'gray' | 'purple';
    width: 'block' | 'fit-contents';
}

const ToggleButton: React.FC<ToggleButtonProps> = ({ 
    leftText, 
    rightText, 
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    isLeftSelected, 
    onChange, 
    title, 
    variant, 
    width 
}) => {
    return (
        <div className={classNames(
            "toggle-button-container",
            `button-width-${width}`
        )}>
            <button 
                className={classNames(
                    "toggle-button-half",
                    "button-base",
                    `button-${variant}`,
                    isLeftSelected ? 'selected' : 'unselected'
                )}
                onClick={() => onChange(true)}
                title={title}
            >
                {LeftIcon && <LeftIcon width="16px" height="16px" />}
                {leftText}
            </button>
            <button 
                className={classNames(
                    "toggle-button-half",
                    "button-base",
                    `button-${variant}`,
                    !isLeftSelected ? 'selected' : 'unselected'
                )}
                onClick={() => onChange(false)}
                title={title}
            >
                {RightIcon && <RightIcon width="16px" height="16px" />}
                {rightText}
            </button>
        </div>
    );
};

export default ToggleButton; 
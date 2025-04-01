/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '../../style/TextAndIconButton.css';
import '../../style/button.css';
import { ButtonProps } from './TextButton';
import { classNames } from '../utils/classNames';


interface TextAndIconButtonProps extends ButtonProps {
    icon: React.ComponentType;
    iconPosition?: 'left' | 'right';
}

const TextAndIconButton: React.FC<TextAndIconButtonProps> = ({ 
    text, 
    icon: Icon, 
    onClick, 
    title, 
    variant,
    iconPosition = 'right' // default to right
}) => {
    const content = iconPosition === 'right' ? (
        <>
            {text}
            <span className="text-and-icon-button__icon">
                <Icon />
            </span>
        </>
    ) : (
        <>
            <span className="text-and-icon-button__icon">
                <Icon />
            </span>
            {text}
        </>
    );

    return (
        <button className={classNames(
            'text-and-icon-button',
            'button-base',
            `button-${variant}`,
            `button-width-fit-contents`
        )} onClick={onClick} title={title}>
            {content}
        </button>
    )
}

export default TextAndIconButton;
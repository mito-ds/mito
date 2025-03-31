/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import { classNames } from '../../../utils/classNames';
import textButtonStyles from './TextButton.module.css'

const TextButton = (props : {
    text: string,
    onClick?: () => void;
    href?: string
    action?: string
    variant?: 'primary' | 'secondary' | 'highlight'
    fontSize?: 'small'
    buttonSize?: 'small' 
    openInNewTab?: boolean
    className?: string
}): JSX.Element => {

    const colorStyle = props.variant === undefined ? textButtonStyles.highlight : textButtonStyles[props.variant];
    const fontStyle = props.fontSize === 'small' ? textButtonStyles.small : textButtonStyles.large;
    const widthStyle = props.buttonSize === 'small' ? textButtonStyles.button_size_small : undefined
    const openInNewTab = props.openInNewTab ?? true

    if (props.action === undefined) {
        return (
            <a 
                className={classNames(textButtonStyles.text_button, colorStyle, fontStyle, widthStyle, props.className)} 
                href={props.href}
                target={openInNewTab ? "_blank": undefined}
                rel="noreferrer"
                onClick={(e) => props.onClick !== undefined ? props.onClick() : undefined}
            >
                {props.text}
            </a>
        )
    } else {
        return (
            <form action={props.action} method="POST" target={openInNewTab ? "_blank": undefined}>
                <button className={classNames(textButtonStyles.text_button, colorStyle, fontStyle, widthStyle, props.className)} type="submit">
                    {props.text}
                </button>
            </form>
        )
    }
    
}

export default TextButton;
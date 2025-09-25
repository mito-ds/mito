/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */


import Link from 'next/link';
import translucentButtonStyles from './TranslucentButton.module.css'
import { classNames } from '../../../utils/classNames';

const TranslucentButton = (props: {
    children: JSX.Element;
    href?: string;
    onClick?: () => void
    className?: string
    variant?: 'install' | 'downloads'
}): JSX.Element => {

    const getHref = () => {
        if (props.href) {
            return props.href;
        }
        if (props.variant === 'downloads') {
            return '/downloads';
        }
        return undefined;
    };

    const href = getHref();

    if (href !== undefined) {
        // Use Next.js Link for internal navigation (downloads variant)
        if (props.variant === 'downloads') {
            return (
                <Link href={href}>
                    <a className={classNames(props.className, translucentButtonStyles.translucent_button)}>
                        {props.children}
                    </a>
                </Link>
            )
        }
        // Use regular anchor for external links
        return (
            <a 
                className={classNames(props.className, translucentButtonStyles.translucent_button)}
                href={href}
                target="_blank"
                rel="noreferrer"
            >
                {props.children}
            </a>
        )
    } else {
        return (
            <button 
                className={classNames(props.className, translucentButtonStyles.translucent_button)}
                onClick={props.onClick}
            >
                {props.children}
            </button>
    
        )
    }
}



export default TranslucentButton;
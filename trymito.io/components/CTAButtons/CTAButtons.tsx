/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import Link from 'next/link';
import { MITO_INSTALLATION_DOCS_LINK } from '../Header/Header';
import TextButton from '../Buttons/TextButton/TextButton';
import ctaButtons from './CTAButtons.module.css'
import { classNames } from '../../utils/classNames';

const JUPYTERLITE_MITO_LINK = 'https://mito-ds.github.io/mitolite/lab?path=mito.ipynb';
export const JUPYTERHUB_MITO_LINK = 'http://launch.trymito.io';
export const CALENDLY_LINK = "https://calendly.com/jake_from_mito/30min";
export const COMPARISON_LINK = '/chatgpt-vs-mito';

const CTAButtons = (props: {
    variant: 'download' | 'contact' | 'try jupyterlite' | 'scroll-to-install' | 'book a demo' | 'try jupyterhub' | 'comparison',
    align: 'left' | 'center',
    displaySecondaryCTA?: boolean
    secondaryCTA?: 'pro' | 'learn more'
    style?: React.CSSProperties;
    ctaText?: string,
    textButtonClassName?: string
}): JSX.Element => {

    const displaySecondaryCTA = props.displaySecondaryCTA ?? true; 
    const secondaryCTA = props.secondaryCTA ?? 'pro';
    return (
        <div
            className={classNames(
                ctaButtons.cta_buttons_container, 
                {[ctaButtons.center] : props.align === 'center'}
            )}
            style={props.style}
        > 
            {props.variant === 'download' && 
                <TextButton 
                    text={props.ctaText || 'Install Mito'}
                    href={MITO_INSTALLATION_DOCS_LINK}
                    className={props.textButtonClassName}
                    variant='purple'
                />
            }
            {props.variant === 'scroll-to-install' && 
                <TextButton 
                    text='Try Mito now'
                    onClick={() => {
                        // Smoothly scroll to the #installation section
                        const el = document.getElementById('installation');
                        if (el) {
                            el.scrollIntoView({behavior: 'smooth'});
                        }
                    }}
                />
            }
            {props.variant === 'try jupyterhub' && 
                <TextButton 
                    text={props.ctaText || 'Try online'}
                    href={JUPYTERHUB_MITO_LINK}
                    className={props.textButtonClassName}
                    variant='secondary'
                />
            }
            {props.variant === 'try jupyterlite' && 
                <TextButton 
                    text={props.ctaText || 'Try Mito'}
                    href={JUPYTERLITE_MITO_LINK}
                    className={props.textButtonClassName}
                />
            }
            {props.variant === 'contact' && 
                <TextButton 
                    text={props.ctaText || 'Contact the Mito Team'}
                    href="mailto:founders@sagacollab.com"
                    className={props.textButtonClassName}
                />
            }
            {props.variant === 'book a demo' && 
                <>
                    <div className='only-on-desktop'>
                        <TextButton 
                            text='Book an Enterprise Demo'
                            href={CALENDLY_LINK}
                            variant='secondary'
                            className={props.textButtonClassName}
                        />
                    </div>
                    <div className='only-on-mobile'>
                        <TextButton 
                            text='Book a Demo'
                            href={CALENDLY_LINK}
                            variant='secondary'
                            className={props.textButtonClassName}
                        />
                    </div>
                </>
            }
            {props.variant === 'comparison' && 
                <TextButton 
                    text='Learn more'
                    href={COMPARISON_LINK}
                    className={props.textButtonClassName}
                />
            }
            
            {displaySecondaryCTA && secondaryCTA === 'pro' && 
                <div className={ctaButtons.cta_subbutton}>
                    <Link href='/plans'>
                        <a className={ctaButtons.pro_cta_text}>
                            or see Pro plans →
                        </a>
                    </Link>
                </div>
            }
            {displaySecondaryCTA && secondaryCTA === 'learn more' && 
                <div className={ctaButtons.cta_subbutton}>
                    <Link href='/'>
                        <a className={ctaButtons.pro_cta_text}>
                            or learn more →
                        </a>
                    </Link>
                </div>
            }
        </div>
    )
}

export default CTAButtons;
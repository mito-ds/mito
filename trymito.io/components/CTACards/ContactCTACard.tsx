/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import titleStyles from '../../styles/Title.module.css'
import ctaCardStyles from './CTACard.module.css'
import CTAButtons from '../CTAButtons/CTAButtons';

const ContactCTACard = (props: {contactCardTitle?: string}): JSX.Element => {

    const title = props.contactCardTitle ? props.contactCardTitle : 'Ready to make your team Python independent?'
    return (
        <div> 
            <h2 className={titleStyles.title}>
                {title}
            </h2>
            <div className='center'>
                <CTAButtons variant='contact' align='center' />
            </div>  
        </div>
    )
}

export default ContactCTACard; 
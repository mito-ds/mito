/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import titleStyles from '../../styles/Title.module.css';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_FOOTER_CARD } from '../../utils/plausible';
import TextButton from '../Buttons/TextButton/TextButton';
import CTAButtons from '../CTAButtons/CTAButtons';

const DownloadSidePanelCTACard = (props: { 
    buttonContainerStyle?: React.CSSProperties 
    textButtonClassName: string
    variant?: 'answers-not-syntax-errors'
}): JSX.Element => {

    let cta = '';
    if (props.variant === 'answers-not-syntax-errors') {
        cta = 'Get answers from your data, not syntax errors. Download the Mito AI analyst'
    } else {
        cta = 'Turn data into insights, reports, and automations 4x faster.'
    }

    return (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}> 
            <p style={{
                textAlign: 'left', 
                fontSize: '1rem', color: 'var(--color-light-background-accent)', 
                fontWeight: 'normal',
                marginBottom: '1rem'
            }}>
                {cta}
            </p>
            <div>
                <TextButton 
                    text='Download Mito'
                    href='/downloads'
                />
            </div>  
        </div>
    )
}

export default DownloadSidePanelCTACard; 
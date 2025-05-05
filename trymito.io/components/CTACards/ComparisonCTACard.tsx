/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import titleStyles from '../../styles/Title.module.css';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_FOOTER_CARD } from '../../utils/plausible';
import CTAButtons from '../CTAButtons/CTAButtons';

const ComparisonCTACard = (props: { 
    headerStyle?: React.CSSProperties, 
    buttonContainerStyle?: React.CSSProperties 
    textButtonClassName?: string | undefined;
}): JSX.Element => {

    return (
        <div> 
            <h2 style={{...props.headerStyle, textAlign: 'left'}} className={titleStyles.title} >
                Tired of copy-pasting code that doesn&apos;t work?
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--color-light-background-accent)', fontWeight: 'normal' }}>
                Write Python code 3.2x faster than ChatGPT.
            </p>
            <div>
                <CTAButtons 
                    style={props.buttonContainerStyle} 
                    variant='comparison' 
                    align='left' 
                    displaySecondaryCTA={false}
                    textButtonClassName={props.textButtonClassName || PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_FOOTER_CARD}
                />
            </div>  
        </div>
    )
}

export default ComparisonCTACard; 
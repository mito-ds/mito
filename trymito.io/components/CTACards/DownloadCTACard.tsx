/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import titleStyles from '../../styles/Title.module.css';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_FOOTER_CARD } from '../../utils/plausible';
import CTAButtons from '../CTAButtons/CTAButtons';

const DownloadCTACard = (props: { 
    headerStyle?: React.CSSProperties, 
    buttonContainerStyle?: React.CSSProperties 
    textButtonClassName?: string | undefined;
}): JSX.Element => {

    return (
        <div> 
            <h2 style={props.headerStyle} className={titleStyles.title}>
                Ready to write Python code 4x faster?
            </h2>
            <div className='center'>
                <CTAButtons style={props.buttonContainerStyle} variant='download' align='center' textButtonClassName={props.textButtonClassName || PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_FOOTER_CARD}/>
            </div>  
        </div>
    )
}

export default DownloadCTACard; 
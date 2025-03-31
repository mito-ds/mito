/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import titleStyles from '../../styles/Title.module.css';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_FOOTER_CARD } from '../../utils/plausible';
import CTAButtons from '../CTAButtons/CTAButtons';

const DashboardCTACard = (): JSX.Element => {

    return (
        <div> 
            <h2 className={titleStyles.title}>
                Ready to save your team hours?
            </h2>
            <div className='center'>
                <CTAButtons variant='download' align='center' textButtonClassName={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_FOOTER_CARD} />
            </div>  
        </div>
    )
}

export default DashboardCTACard; 
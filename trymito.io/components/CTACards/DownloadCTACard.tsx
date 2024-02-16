import titleStyles from '../../styles/Title.module.css';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_FOOTER_CARD } from '../../utils/plausible';
import CTAButtons from '../CTAButtons/CTAButtons';

const DownloadCTACard = (): JSX.Element => {

    return (
        <div> 
            <h2 className={titleStyles.title}>
                Want to install Mito locally?
            </h2>
            <div className='center'>
                <CTAButtons variant='download' align='center' textButtonClassName={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_FOOTER_CARD}/>
            </div>  
        </div>
    )
}

export default DownloadCTACard; 
import titleStyles from '../../styles/Title.module.css'
import ctaCardStyles from './CTACard.module.css'
import CTAButtons from '../CTAButtons/CTAButtons';

const DownloadCTACard = (): JSX.Element => {

    return (
        <div> 
            <h1 className={titleStyles.title}>
                Want to save time on your Python data analysis?
            </h1>
            <div className='center'>
                <CTAButtons variant='download' />
            </div>  
        </div>
    )
}

export default DownloadCTACard; 
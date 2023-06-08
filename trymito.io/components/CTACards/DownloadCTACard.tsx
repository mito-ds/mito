import titleStyles from '../../styles/Title.module.css';
import CTAButtons from '../CTAButtons/CTAButtons';

const DownloadCTACard = (): JSX.Element => {

    return (
        <div> 
            <h1 className={titleStyles.title}>
                Want to install Mito locally?
            </h1>
            <div className='center'>
                <CTAButtons variant='download' />
            </div>  
        </div>
    )
}

export default DownloadCTACard; 
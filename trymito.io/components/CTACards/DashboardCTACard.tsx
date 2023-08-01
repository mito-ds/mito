import titleStyles from '../../styles/Title.module.css';
import CTAButtons from '../CTAButtons/CTAButtons';

const DashboardCTACard = (): JSX.Element => {

    return (
        <div> 
            <h2 className={titleStyles.title}>
                Ready to save your team hours?
            </h2>
            <div className='center'>
                <CTAButtons variant='download' align='center'/>
            </div>  
        </div>
    )
}

export default DashboardCTACard; 
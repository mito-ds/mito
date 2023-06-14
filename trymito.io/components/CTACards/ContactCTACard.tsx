import titleStyles from '../../styles/Title.module.css'
import ctaCardStyles from './CTACard.module.css'
import CTAButtons from '../CTAButtons/CTAButtons';

const ContactCTACard = (): JSX.Element => {

    return (
        <div> 
            <h1 className={titleStyles.title}>
                Ready to make your team Python independent?
            </h1>
            <div className='center'>
                <CTAButtons variant='contact' />
            </div>  
        </div>
    )
}

export default ContactCTACard; 
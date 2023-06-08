import Link from 'next/link';
import { MITO_INSTALLATION_DOCS_LINK } from '../Header/Header';
import TextButton from '../TextButton/TextButton';
import styles from './CTAButtons.module.css'

const JUPYTERLITE_MITO_LINK = 'https://mito-ds.github.io/mitolite/lab?path=mito.ipynb';

const CTAButtons = (props: {variant: 'download' | 'contact' | 'try jupyterlite'}): JSX.Element => {

    return (
        <div className={styles.cta_buttons_container}> 
            {props.variant === 'download' && 
                <TextButton 
                    text='Install Mito'
                    href={MITO_INSTALLATION_DOCS_LINK}
                />
            }
            {props.variant === 'try jupyterlite' && 
                <>
                    <TextButton 
                        text='Try Mito'
                        href={JUPYTERLITE_MITO_LINK}
                    />
                    <a href="https://www.producthunt.com/posts/mito-ai?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-mito&#0045;ai" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=398626&theme=light" alt="Mito&#0032;AI - Automate&#0032;Excel&#0032;reports&#0032;with&#0032;AI | Product Hunt" style={{width: '250px', height: '30px'}} width="250" height="54" /></a>
                </>
            }
            {props.variant === 'contact' && 
                <TextButton 
                    text='Contact the Mito Team'
                    href="mailto:founders@sagacollab.com"
                />
            }
            
            <h2 className={styles.cta_subbutton}>
                <Link href='/plans'>
                    <a>
                        or see Pro plans →
                    </a>
                </Link>
            </h2>
        </div>
    )
}

export default CTAButtons;
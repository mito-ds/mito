import Image from 'next/image'

import pageStyles from '../../styles/Page.module.css'
import { classNames } from '../../utils/classNames'
import customerCardStyles from './CustomerCard.module.css'

const CustomerCard = (props: {
    customerName: string,
    imageSrc: string,
    quoteText: string
    width: number 
    readMoreLink?: string
}): JSX.Element => {

    return (
        <div 
            className={classNames(customerCardStyles.container, {[customerCardStyles.border_on_hover]: props.readMoreLink !== undefined})}
            onClick={props.readMoreLink !== undefined ? () => window.open(props.readMoreLink, '_blank'): undefined}
        >
            <div className={customerCardStyles.image}>
                <Image 
                    height={58} // Use the same height in every card for uniformity
                    width={props.width} // Set the propper width for the image given the 58px height
                    src={props.imageSrc}     
                    alt={props.customerName}       
                />
            </div>
            <p className={customerCardStyles.customer_name}>{props.customerName}</p>
            <p className='quote'><span className={customerCardStyles.quote_symbol}>❝</span>{props.quoteText}</p>
            {props.readMoreLink && 
                <p className={classNames(pageStyles.link, customerCardStyles.read_more)}>Read More →</p> 
            }
        </div>
    )   
}

export default CustomerCard; 
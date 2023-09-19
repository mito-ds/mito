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
        <div className={customerCardStyles.container}>
            <div className={customerCardStyles.image}>
                <Image 
                    height={58} // Use the same height in every card for uniformity
                    width={props.width} // Set the propper width for the image given the 58px height
                    src={props.imageSrc}            
                />
            </div>
            <p className={customerCardStyles.customer_name}>{props.customerName}</p>
            <p className='quote'><span className={customerCardStyles.quote_symbol}>❝</span>{props.quoteText}</p>
            {props.readMoreLink && 
                <a href={props.readMoreLink} target="_blank" rel="noreferrer" className={classNames(pageStyles.link, customerCardStyles.read_more)}>Read More →</a> 
            }
        </div>
    )
    
}

export default CustomerCard; 
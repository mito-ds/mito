import Image from 'next/image'
import { useState } from 'react'

import pageStyles from '../../styles/Page.module.css'
import faqCardStyles from './FAQCard.module.css'

import OpenFaq from '../../public/OpenFaq.png'
import CloseFaq from '../../public/CloseFaq.png'

const FAQCard = (props: {title: string, children: JSX.Element, id?: string}): JSX.Element => {

    const [faqCardOpen, setFaqCardOpen] = useState<boolean>(false)
    const imageSrc = faqCardOpen ? CloseFaq : OpenFaq
    const imageAlt = faqCardOpen ? 'Close FAQ': 'Open FAQ'
    const imageHeight = faqCardOpen ? 5 : 20

    return (
        <div 
            className={pageStyles.background_card + ' ' + faqCardStyles.faq_card_container}
            id={props.id}
        >
            <div 
                className={faqCardStyles.header}
                onClick={() => {
                    setFaqCardOpen(prevFaqCardOpen => !prevFaqCardOpen)
                }}
            >
                <h1>
                    {props.title}
                </h1>
                <div>
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        width={20}
                        height={imageHeight}
                    />
                </div>
            </div>
            {faqCardOpen &&
                props.children
            }
        </div>
    )
    
}

export default FAQCard; 
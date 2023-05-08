import Image from 'next/image'

import pageStyles from '../../styles/Page.module.css'
import expandableCardStyles from './ExpandableCard.module.css'

import OpenIconLight from '../../public/OpenIconLight.png'
import CloseIconLight from '../../public/CloseIconLight.png'

const ExpandableCard = (props: {
    title: string, 
    shortTitle?: string
    className?: string,
    children: JSX.Element, 
    isOpen: boolean,
    onClick: () => void;
}): JSX.Element => {

const imageSrc = props.isOpen ? CloseIconLight : OpenIconLight
    const imageAlt = props.isOpen ? 'Close Card': 'Open Card'
    const imageHeight = props.isOpen ? 5 : 20

    const selectedBackgroundColorClass = props.isOpen ? expandableCardStyles.expandable_card_container_selected: ''
    const className = props.className !== undefined ? props.className : ''

    return (
        <div 
            className={
                pageStyles.background_card + ' ' + 
                expandableCardStyles.expandable_card_container + ' ' +
                selectedBackgroundColorClass + ' ' +
                className
            }
            id={props.title}
            onClick={() => props.onClick()}
        >
            <div 
                className={expandableCardStyles.header}
            >
                <p className='display-desktop-only-block'><b>
                    {props.title}
                </b></p>
                <p className='display-mobile-only'><b>
                    {props.shortTitle}
                </b></p>
                
                
                <div>
                    <Image
                        src={imageSrc}
                        alt={imageAlt}
                        width={20}
                        height={imageHeight}
                    />
                </div>
            </div>
            {props.isOpen &&
                props.children
            }
        </div>
    )
    
}

export default ExpandableCard; 
import Image from 'next/image'

import imageTextCardStyles from './ImageTextCard.module.css'
import { classNames } from '../../utils/classNames'

const ImageTextCard = (props: {
    title: string, 
    shortTitle?: string
    imageSrc: string
}): JSX.Element => {

    return (
        <div className={classNames(imageTextCardStyles.container)}>
            <Image
                src={props.imageSrc}
                alt={props.title}
                width={20}
                height={20}
            />
            <p className={imageTextCardStyles.title_text}>
                {props.title}
            </p>
        </div>
    )
    
}

export default ImageTextCard; 
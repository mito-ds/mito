import Image from 'next/image'

import streamlitAppCardStyles from './StreamlitAppCard.module.css'
import { classNames } from '../../utils/classNames'

const StreamlitAppCard = (props: {
    title: string, 
    description: string
    imageSrc: string
    href: string
    tags?: string[]
}): JSX.Element => {

    const hashtags = props.tags?.map((tag) => `#${tag}`)
    const hashtagString = hashtags?.join(' ')

    return (
        <div className={classNames(streamlitAppCardStyles.container)}>
            <Image
                src={props.imageSrc}
                alt={props.title}
                width={264}
                height={132}
            />
            <p className={streamlitAppCardStyles.title_text}>
                {props.title}
            </p>
            <p className={streamlitAppCardStyles.description}>
                {props.description}
            </p>
            {hashtagString !== undefined && 
                <div className={streamlitAppCardStyles.hashtag_container}>
                    <p className={streamlitAppCardStyles.hashtag}>
                        {hashtagString}
                    </p>
                </div>
                
            }
        </div>
    )
    
}

export default StreamlitAppCard; 
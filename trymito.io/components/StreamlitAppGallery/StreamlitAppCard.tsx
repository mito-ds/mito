/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import Image from 'next/image'

import streamlitAppCardStyles from './StreamlitAppCard.module.css'
import pageStyles from '../../styles/Page.module.css'
import { classNames } from '../../utils/classNames'

const StreamlitAppCard = (props: {
    title: string, 
    description: string
    imageSrc: string
    streamlitHref: string
    gitHubHref: string
    tags?: string[]
}): JSX.Element => {

    const hashtags = props.tags?.map((tag) => `#${tag}`)
    const hashtagString = hashtags?.join(' ')

    return (
        <div className={classNames(streamlitAppCardStyles.container)}>
            <Image
                className={streamlitAppCardStyles.streamlit_app_image}
                src={props.imageSrc}
                alt={props.title}
                width={264}
                height={132}
                onClick={() => window.open(props.streamlitHref, '_blank')}
            />
            <a href={props.streamlitHref} target="_blank" rel="noreferrer" className={streamlitAppCardStyles.title_text}>
                {props.title}
            </a>
            <p className={streamlitAppCardStyles.description}>
                {props.description}
            </p>
            
            <div className={streamlitAppCardStyles.footer}>
                <a href={props.gitHubHref} target="_blank" rel="noreferrer" className={streamlitAppCardStyles.view_code}>
                    View Code →
                </a>
                <p className={streamlitAppCardStyles.hashtag}>
                    {hashtagString}
                </p>
            </div>
        </div>
    )
    
}

export default StreamlitAppCard; 
import Image from 'next/image'
import { useState } from 'react'
import stylesGithubButton from './GithubButton.module.css'

type GithubButtonVariant = 'Star' | 'Discussion'

const GithubButton = (props: {variant: GithubButtonVariant, text: string}): JSX.Element => {

    const imageSrc = props.variant === 'Star' ? '/GithubStarIcon.svg' : '/GithubDiscussionIcon.svg'
    const href = props.variant === 'Star' ? 'https://github.com' : 'https://github.com'

    return (
        <a href={href} rel="noreferrer" target="_blank">
            <button className={stylesGithubButton.github_button}>
                <Image src={imageSrc} height='20rem' width='20rem' alt='Github button icon' />
                <p>
                    {props.text}
                </p>
            </button>
        </a>
    )
}

export default GithubButton; 
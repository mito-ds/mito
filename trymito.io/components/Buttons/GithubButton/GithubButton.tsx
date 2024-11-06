import Image from 'next/image'
import stylesGithubButton from './GithubButton.module.css'

type GithubButtonVariant = 'Star' | 'Issue'
export const MITO_GITHUB_LINK = 'https://github.com/mito-ds/mito'
export const MTIO_GITHUB_DISCUSSION_LINK = 'https://github.com/mito-ds/mito/issues'

const GithubButton = (props: {variant: GithubButtonVariant, text: string}): JSX.Element => {

    const imageSrc = props.variant === 'Star' ? '/GithubStarIcon.svg' : '/GithubDiscussionIcon.svg'
    const href = props.variant === 'Star' ? MITO_GITHUB_LINK : MTIO_GITHUB_DISCUSSION_LINK

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
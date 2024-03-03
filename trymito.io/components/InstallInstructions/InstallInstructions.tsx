import Link from 'next/link';
import CodeBlock from '../CodeBlock/CodeBlock';
import ctaButtons from '../CTAButtons/CTAButtons.module.css'
import installInstructions from './InstallInstructions.module.css'
import pageStyles from '../../styles/Home.module.css';
import { MITO_INSTALLATION_DOCS_LINK } from '../Header/Header';
import { MITO_GITHUB_LINK } from '../GithubButton/GithubButton';


const InstallInstructions = (props: {}): JSX.Element => {
    return (
        <>
            <h2 style={{textAlign: 'center'}}>
                Install <span className='text-highlight'><a className={pageStyles.link} href={MITO_GITHUB_LINK} target="_blank" rel="noopener">open-source</a></span> Mito <br/>
                in under a minute
            </h2>
            <div className={installInstructions.install_instructions_container}>
                <CodeBlock prefix='$ ' paddingRight='7rem'>
                    pip install mitosheet
                </CodeBlock>
                <CodeBlock prefix='$ ' paddingRight='7rem'>
                    python -m mitosheet hello
                </CodeBlock>
                <div className={ctaButtons.cta_subbutton}>
                    <Link href={MITO_INSTALLATION_DOCS_LINK}>
                        <a className={ctaButtons.pro_cta_text}>
                            or see our docs →
                        </a>
                    </Link>
                </div>
            </div>
        </>
    )
}

export default InstallInstructions;
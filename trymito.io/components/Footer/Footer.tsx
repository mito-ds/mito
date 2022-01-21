import Link from 'next/link';
import Image from "next/image"
import footerStyle from './Footer.module.css'
import pageStyle from '../../styles/Page.module.css'
import { MITO_GITHUB_LINK } from '../GithubButton/GithubButton';

const Footer = (): JSX.Element => {

    return (
        <footer className={footerStyle.footer_container}>
            <div className='flex-column'>
                <div className='flex-row'>
                    <h1>
                        Mito
                    </h1>
                    <Link href='/'>
                        <a className={footerStyle.logo_container}> 
                            <Image src="/Mito.svg" alt="Mito Logo" width={50} height={30}/>
                        </a>
                    </Link>
                </div>
                <p>
                    © Saga, Inc. 2021
                </p>
                <div className={footerStyle.footer_link}>
                    <a className={pageStyle.link} href={"mailto:founders@sagacollab.com"}>
                        founders@sagacollab.com
                    </a>
                </div>
            </div>
            
            <div className={footerStyle.site_map_container}>
                <div className='flex-column'>
                    <ol>
                        Product
                    </ol>
                    <li className='text-nav'>
                        <a href={MITO_GITHUB_LINK} target="_blank" rel="noreferrer">GitHub</a>
                    </li>
                    <li className='text-nav'>
                        <a href='https://docs.trymito.io/getting-started/installing-mito' target="_blank" rel="noreferrer">Install</a>
                    </li>
                    <li className='text-nav'>
                        <Link href='/security'>Security</Link>
                    </li>
                    <li className='text-nav'>
                        <a href='https://discord.gg/XdJSZyejJU' target="_blank" rel="noreferrer">Support</a>
                    </li>
                </div>
                <div className='flex-column'>
                    <ol>
                        Resources
                    </ol>
                    <li className='text-nav'>
                        <a href='https://docs.trymito.io' target="_blank" rel="noreferrer">Docs</a>
                    </li>
                    <li className='text-nav'>
                        <a href='https://docs.trymito.io/misc./terms-of-service' target="_blank" rel="noreferrer">Terms</a>
                    </li>
                    <li className='text-nav'>
                        <a href='https://privacy.trymito.io/privacy-policy' target="_blank" rel="noreferrer">Privacy</a>
                    </li>
                    <li className='text-nav'>
                        <a href='https://discord.gg/XdJSZyejJU' target="_blank" rel="noreferrer">Discord</a>
                    </li>
                </div>
                <div className='flex-column'>
                    <ol>
                        Company
                    </ol>
                    <li className='text-nav'>
                        <a href='https://trymito.notion.site/Jobs-Mito-f7becf2466044c6199866addfbf45cba' target="_blank" rel="noreferrer">Jobs</a>
                    </li>
                    <li className='text-nav'>
                        <a href='https://twitter.com/tryMito' target="_blank" rel="noreferrer">Twitter</a>
                    </li>
                    <li className='text-nav'>
                        <a href='https://www.youtube.com/channel/UCN9o_0m1fwCjigfIpnKr0oA/videos' target="_blank" rel="noreferrer">YouTube</a>
                    </li>
                    <li className='text-nav'>
                        <a href='https://discord.gg/XdJSZyejJU' target="_blank" rel="noreferrer">Contact</a>
                    </li>
                </div>
            </div>
        </footer>
    )
}

export default Footer; 
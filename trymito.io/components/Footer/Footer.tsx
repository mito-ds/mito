import Link from 'next/link';
import Image from "next/image"
import footerStyle from './Footer.module.css'
import pageStyle from '../../styles/Page.module.css'
import { MITO_GITHUB_LINK } from '../GithubButton/GithubButton';
import { JOBS_BOARD_LINK, MITO_INSTALLATION_DOCS_LINK } from '../Header/Header';
import { classNames } from '../../utils/classNames';

const Footer = (): JSX.Element => {

    return (
        <footer className={footerStyle.footer_container}>
            <div className='flex-column'>
                <div className={footerStyle.home_container}>
                    <p className={footerStyle.footer_mito_text}>
                        <b>Mito</b>
                    </p>
                    <Link href='/'>
                        <a className={footerStyle.logo_container}> 
                            <Image src="/Mito.svg" alt="Mito Logo" width={50} height={30}/>
                        </a>
                    </Link>
                </div>
                <p>
                    © Saga, Inc. 2024
                </p>
                <div className={footerStyle.footer_link}>
                    <a className={pageStyle.link} href={"mailto:founders@sagacollab.com"}>
                        founders@sagacollab.com
                    </a>
                </div>
            </div>
            
            <div className={footerStyle.site_map_container}>
                <div className={classNames('flex-column', footerStyle.site_map_column)}>
                    <ol>
                        Product
                    </ol>
                    <li className={classNames(footerStyle.nav_item)}>
                        <Link href='/spreadsheet-automation'>Mito Spreadsheet</Link>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <Link href='/python-ai-tools'>Mito AI</Link>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <Link href='/low-code-sql'>Low-Code SQL</Link>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <Link href='/data-app'>Data App</Link>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <Link href='/infrastructure-integration-python-tool'>Infrastructure Integration</Link>
                    </li>
                </div>
                <div className={classNames('flex-column', footerStyle.site_map_column)}>
                    <ol>
                        Use Cases
                    </ol>
                    <li className={classNames(footerStyle.nav_item)}>
                        <Link href='/use-cases/python-training'>Python Training</Link>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <Link href='/industries/financial-services'>Financial Services</Link>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <Link href='/industries/life-sciences'>Life Sciences</Link>
                    </li>
                </div>
                <div className={classNames('flex-column', footerStyle.site_map_column)}>
                    <ol>
                        Resources
                    </ol>
                    <li className={classNames(footerStyle.nav_item)}>
                        <a href='https://docs.trymito.io' target="_blank" rel="noreferrer">Docs</a>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <Link href='/excel-to-python/'>Excel to Python</Link>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <Link href='/blog'>Blog</Link>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <a href={MITO_GITHUB_LINK} target="_blank" rel="noreferrer">GitHub</a>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <a href='https://discord.gg/XdJSZyejJU' target="_blank" rel="noreferrer">Discord</a>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <a href='https://join.slack.com/t/trymito/shared_invite/zt-1h6t163v7-xLPudO7pjQNKccXz7h7GSg' target="_blank" rel="noreferrer">Slack</a>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <a href={MITO_INSTALLATION_DOCS_LINK} target="_blank" rel="noreferrer">Install</a>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <Link href='/teams'>Teams</Link>
                    </li>
                </div>
                <div className={classNames('flex-column', footerStyle.site_map_column)}>
                    <ol>
                        Company
                    </ol>
                    <li className={classNames(footerStyle.nav_item)}>
                        <Link href='/customers'>Customers</Link>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <a href={JOBS_BOARD_LINK} target="_blank" rel="noreferrer">Jobs</a>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <Link href='/security'>Security</Link>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <a href='https://docs.trymito.io/misc/terms-of-service' target="_blank" rel="noreferrer">Terms</a>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <a href='https://privacy.trymito.io/privacy-policy' target="_blank" rel="noreferrer">Privacy</a>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <a href='https://twitter.com/tryMito' target="_blank" rel="noreferrer">Twitter</a>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <a href='https://www.youtube.com/channel/UCN9o_0m1fwCjigfIpnKr0oA/videos' target="_blank" rel="noreferrer">YouTube</a>
                    </li>
                    <li className={classNames(footerStyle.nav_item)}>
                        <a href='https://join.slack.com/t/trymito/shared_invite/zt-1h6t163v7-xLPudO7pjQNKccXz7h7GSg' target="_blank" rel="noreferrer">Contact</a>
                    </li>
                </div>
            </div>
        </footer>
    )
}

export default Footer; 
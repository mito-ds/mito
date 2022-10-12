import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

import stylesHeader from './Header.module.css'
import CloseButton from '../../public/CloseButton.png'
import TranslucentButton from "../TranslucentButton/TranslucentButton"
import GithubButton, { MITO_GITHUB_LINK } from "../GithubButton/GithubButton"

export const MITO_INSTALLATION_DOCS_LINK = 'https://docs.trymito.io/getting-started/installing-mito'

const Header = (): JSX.Element => {

    const [mobileMenuVisible, setMobileMenuVisible] = useState(false)

    return (
        <header className={stylesHeader.header}>
          <div className={stylesHeader.desktop_left_nav_bar}>
            <Link href='/'>
              <a> {/* We have to add this for the link to work, see here: https://github.com/vercel/next.js/issues/20434 */}
                <Image src="/Mito.svg" alt="Mito Logo" width={50} height={30}/>
              </a>
            </Link>
          </div>

          <div className={stylesHeader.desktop_center_nav_bar + ' ' + stylesHeader.desktop_header_component}>
            <nav>
              <ul>
                <li className='text-nav'>
                  <Link href='/plans'>Plans</Link>
                </li>
                <li className='text-nav'>
                  <Link href='/teams'>Teams</Link>
                </li>
                <li className='text-nav'>
                  <Link href='/security'>Security</Link>
                </li>
                <li className='text-nav'>
                  <a href='https://docs.trymito.io' target="_blank" rel="noreferrer">Docs</a>
                </li>
              </ul>
            </nav>
          </div>

          <div className={stylesHeader.desktop_right_nav_bar}>
              <GithubButton 
                variant='Star'
                text='Star on Github'
              />              
              <TranslucentButton
                href={MITO_INSTALLATION_DOCS_LINK}
              >
                <>
                  Install
                </>
              </TranslucentButton>
          </div>


          {/* This next section is the header for mobile only */}
          <div 
            className={stylesHeader.menu_bar_container + ' display-mobile-only'}
            aria-controls='mobile_nav_menu'
            onClick={() => setMobileMenuVisible(mobileMenuVisible => !mobileMenuVisible)}
          >
            {/* Menu adapted from: https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_menu_icon_js */}
            <div className={stylesHeader.menu_bar}></div>
            <div className={stylesHeader.menu_bar}></div>
            <div className={stylesHeader.menu_bar}></div>
          </div>
          <div 
            id='mobile_nav_menu' 
            className={stylesHeader.mobile_nav_menu + (mobileMenuVisible ? '' : ' ' + stylesHeader.mobile_nav_menu_hidden)}
          >
            <div className={stylesHeader.mobile_nav_bar_close_container}>
              <div className={stylesHeader.mobile_nav_bar_close_button}
                onClick={() => setMobileMenuVisible(false)}
              >
                <Image src={CloseButton} alt='close mobile navbar' width={30} height={30} />
              </div>
            </div>
            <nav>
              <ul>
                <li className='text-nav'>
                  <Link href='/plans'>Plans</Link>
                </li>
                <li className='text-nav'>
                  <Link href='/teams'>Teams</Link>
                </li>
                <li className='text-nav'>
                  <Link href='/security'>Security</Link>
                </li>
                <li className='text-nav'>
                  <a href='https://docs.trymito.io' target="_blank" rel="noreferrer">Docs</a>
                </li>
                <li className='text-nav'>
                  <a href={MITO_GITHUB_LINK} target="_blank" rel="noreferrer">GitHub</a>
                </li>
              </ul>
            </nav>
          </div>
        </header>
    )
}

export default Header;
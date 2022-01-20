import '../styles/globals.css'
import type { AppProps } from 'next/app'
import React, { useEffect, useState } from 'react';

// TODO:  Make sure the mobile view is used on phones
// If not, look at this: https://www.freecodecamp.org/news/responsive-web-design-how-to-make-a-website-look-good-on-phones-and-tablets/

function MyApp({ Component, pageProps }: AppProps) {

  return (
      <Component {...pageProps} />
  )
}

export default MyApp

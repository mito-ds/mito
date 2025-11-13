/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import '../styles/globals.css'
import '../styles/margins.css'
import type { AppProps } from 'next/app'
import React from 'react';
import Head from 'next/head';

const DOMAIN = "trymito.io";
const URL = `https://${DOMAIN}`;
const TITLE = "Best Python Spreadsheet Automation & Code Generation | Mito";
const DESCRIPTION = "Mito is the fastest way to do Python data science. Edit your data in a spreadsheet, and generate Python code automatically.";
const IMAGE = "/mito-og-banner.jpg";

function MyApp({ Component, pageProps }: AppProps) {

  return (
    <>
      <Head>
        <meta name="viewport" content="viewport-fit=cover" />
        <meta name="description" content={DESCRIPTION}/>

        {/* Open Graph Meta Tags */}
        <meta property="og:url" content={URL} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content={IMAGE} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />

        {/* Twitter Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content={DOMAIN} />
        <meta property="twitter:url" content={URL} />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content={IMAGE} />
      </Head>
      <Component {...pageProps} />

    </>
  )
}

export default MyApp

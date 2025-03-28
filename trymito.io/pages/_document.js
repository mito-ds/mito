/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

/*
    This is a Custom Document. A custom Document is commonly used to 
    augment your application's <html> and <body> tags. This is necessary 
    because Next.js pages skip the definition of the surrounding document's markup.

    See full explanation here: https://nextjs.org/docs/advanced-features/custom-document
*/

import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {

  render() {
    return (
      <Html>
        <Head>
            {/* Google Tag Manager */}
            <script dangerouslySetInnerHTML={{
            __html: `(function (w, d, s, l, i) {
                    w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
                    var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
                    j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
                })(window, document, 'script', 'dataLayer', 'GTM-KN6DBGMH');`
            }}></script>
            {/* End Google Tag Manager */}

            {/* TODO: The favicon doesn't look too good, we should make some with the */}
            <link rel="icon" href="/favicons/favicon.ico" />

            <html lang="en"></html>
            <link
                rel="preload"
                href="/fonts/Graphik/GraphikRegular.otf"
                as="font"
                crossOrigin=""
            />
            <link
                rel="preload"
                href="/fonts/Graphik/GraphikMedium.otf"
                as="font"
                crossOrigin=""
            />
            <script defer data-domain="trymito.io" src="https://plausible.io/js/script.tagged-events.js"></script>

            <script id="warmly-script-loader" src="https://opps-widget.getwarmly.com/warmly.js?clientId=e4336c1da59e3e0cfb4027b910ee505a" defer></script>

            {/* Import Prism.js and css*/}
            <link rel="stylesheet" href="/prism.css" />
            <script defer src="/prism.js"></script>
        </Head> 
        <body>
            {/* Google Tag Manager (noscript) */}
            <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-KN6DBGMH"
            height="0" width="0" style={{"display": "none", "visibility": "hidden"}}></iframe></noscript>
            {/* End Google Tag Manager (noscript) */}
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument

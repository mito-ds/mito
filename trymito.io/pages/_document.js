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
            <script defer data-domain="trymito.io" src="https://plausible.io/js/script.js"></script>
            {/* Import Prism.js and css*/}
            <link rel="stylesheet" href="/prism.css" />
            <script defer src="/prism.js"></script>
        </Head> 
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument

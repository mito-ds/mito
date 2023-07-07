import '../styles/globals.css'
import '../styles/margins.css'
import type { AppProps } from 'next/app'
import React from 'react';
import Head from 'next/head';
import Script from 'next/script';

function MyApp({ Component, pageProps }: AppProps) {

  return (
    <>
      <Head>
        <meta name="viewport" content="viewport-fit=cover" />
        <meta name="description" content="Mito is the fastest way to do Python data science. Edit your data in a spreadsheet, and generate Python code automatically."/>
      </Head>
      <Script
        id="intercom"
        dangerouslySetInnerHTML={{
          __html: `
          (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/mu6azgiv';var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
          `,
        }}
      />
      <Component {...pageProps} />

    </>
  )
}

export default MyApp

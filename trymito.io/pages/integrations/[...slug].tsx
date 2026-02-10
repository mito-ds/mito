/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';
import { GetStaticProps } from 'next';

import pageStyles from '../../styles/Page.module.css';
import integrationStyles from '../../styles/IntegrationPage.module.css';
import { classNames } from '../../utils/classNames';

import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import CTAButtons from '../../components/CTAButtons/CTAButtons';
import CodeBlock from '../../components/CodeBlock/CodeBlock';
import FAQCard from '../../components/FAQCard/FAQCard';

import { IntegrationPageContent, QuickStartStep } from '../../integrations-page-contents/types';
import { getIntegrationPageContentArray, getIntegrationPageBySlug } from '../../utils/integrations';

import 'prism-themes/themes/prism-coldark-dark.css';
import Prism from 'prismjs';
require('prismjs/components/prism-python');

function isQuickStartStepObject(step: QuickStartStep): step is { title: string; body: string } {
  return typeof step === 'object' && step !== null && 'title' in step && 'body' in step;
}

const IntegrationPage = (props: { pageContent: IntegrationPageContent }): JSX.Element => {
  const c = props.pageContent;
  const canonicalPath = `https://www.trymito.io/integrations/${c.slug}`;

  useEffect(() => {
    Prism.highlightAll();
  }, []);

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  return (
    <>
      <Head>
        <title>{c.metaTitle}</title>
        <meta name="description" content={c.metaDescription} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonicalPath} />
        <meta property="og:title" content={c.metaTitle} />
        <meta property="og:description" content={c.metaDescription} />
        <meta property="og:url" content={canonicalPath} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={c.metaTitle} />
        <meta name="twitter:description" content={c.metaDescription} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </Head>
      <Header />

      <div className={pageStyles.container}>
        <main className={classNames(pageStyles.main, pageStyles.main_left_align)}>
          <div className={integrationStyles.content_column}>
            {/* Hero */}
            <section className={integrationStyles.section}>
              <h1 className={integrationStyles.hero_title}>
                {c.heroHeadline}
              </h1>
              <p className={integrationStyles.hero_subhead}>{c.heroSubhead}</p>
              <CTAButtons variant="download" align="left" />
            </section>

            {/* Model spec card */}
            <section className={integrationStyles.section}>
              <h2 className={integrationStyles.section_heading}>
                {c.modelDisplayName} at a glance
              </h2>
              <div className={classNames(pageStyles.background_card, integrationStyles.model_card)}>
                <div className={integrationStyles.model_card_row}>
                  <span className={integrationStyles.model_card_label}>Provider</span>
                  <span>{c.modelSpec.provider}</span>
                </div>
                <div className={integrationStyles.model_card_row}>
                  <span className={integrationStyles.model_card_label}>Token limit</span>
                  <span>{c.modelSpec.tokenLimit}</span>
                </div>
                <div className={integrationStyles.model_card_row}>
                  <span className={integrationStyles.model_card_label}>Speed</span>
                  <span>{c.modelSpec.speed}</span>
                </div>
                <div className={integrationStyles.model_card_row}>
                  <span className={integrationStyles.model_card_label}>Complexity</span>
                  <span>{c.modelSpec.complexityHandling}</span>
                </div>
                <div>
                  <span className={integrationStyles.model_card_label}>Best for</span>
                  <ul className={integrationStyles.model_card_list}>
                    {c.modelSpec.bestFor.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className={integrationStyles.model_card_label}>Limitations</span>
                  <ul className={integrationStyles.model_card_list}>
                    {c.modelSpec.limitations.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Quick start */}
            <section className={integrationStyles.section}>
              <h2 className={integrationStyles.section_heading}>Quick start</h2>
              <ol className={integrationStyles.quick_steps}>
                {c.quickStartSteps.map((step, i) => (
                  <li key={i}>
                    <span className={integrationStyles.quick_steps_number}>{i + 1}</span>
                    <div className={integrationStyles.quick_steps_body}>
                      {isQuickStartStepObject(step) ? (
                        <>
                          <p>{step.title}</p>
                          <p>{step.body}</p>
                        </>
                      ) : (
                        <p>{step}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            {/* DIY API */}
            <section className={integrationStyles.section}>
              <h2 className={integrationStyles.section_heading}>
                Using the {c.providerName} API directly
              </h2>
              <p>{c.apiSectionIntro}</p>
              <CodeBlock>{c.apiCodeBlock}</CodeBlock>
              <div className={classNames(pageStyles.background_card, integrationStyles.callout_box)}>
                <div>
                  <div className={integrationStyles.callout_heading}>Limitations of the API alone</div>
                  <ul className={integrationStyles.callout_list}>
                    {c.apiCalloutLimitations.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className={integrationStyles.callout_heading}>With Mito</div>
                  <ul className={integrationStyles.callout_list}>
                    {c.apiCalloutMitoBenefits.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* Use cases */}
            <section className={integrationStyles.section}>
              <h2 className={integrationStyles.section_heading}>Use cases</h2>
              <ul className={integrationStyles.use_cases_list}>
                {c.useCases.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>

            {/* Comparison table */}
            <section className={integrationStyles.section}>
              <h2 className={integrationStyles.section_heading}>
                Mito + {c.modelDisplayName} vs {c.modelDisplayName} API direct
              </h2>
              <table className={integrationStyles.comparison_table}>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>With Mito</th>
                    <th>Direct API</th>
                  </tr>
                </thead>
                <tbody>
                  {c.comparisonRows.map((row, i) => (
                    <tr key={i}>
                      <td>{row.feature}</td>
                      <td>{row.withMito}</td>
                      <td>{row.directApi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* FAQ */}
            <section className={integrationStyles.section}>
              <h2 className={integrationStyles.section_heading}>FAQ</h2>
              <div className={integrationStyles.faq_wrapper}>
                {c.faqs.map((faq, i) => (
                  <FAQCard key={i} title={faq.question} index={i + 1}>
                    <p>{faq.answer}</p>
                  </FAQCard>
                ))}
              </div>
            </section>

            {/* Related */}
            {c.relatedSlugs.length > 0 && (
              <section className={integrationStyles.section}>
                <h2 className={integrationStyles.section_heading}>Related integrations</h2>
                <div className={integrationStyles.related_links}>
                  {c.relatedSlugs.map((relatedSlug) => (
                    <Link key={relatedSlug} href={`/integrations/${relatedSlug}`}>
                      <a className={pageStyles.link}>
                        {relatedSlug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </a>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export async function getStaticPaths() {
  const pages = getIntegrationPageContentArray();
  const paths = pages.map((page) => ({
    params: { slug: [page.slug] },
  }));
  return { paths, fallback: false };
}

export const getStaticProps: GetStaticProps = async (context) => {
  const slug = context.params?.slug as string[] | undefined;
  const pageContent = slug ? getIntegrationPageBySlug(slug) : null;

  if (!pageContent) {
    return { notFound: true };
  }

  return {
    props: { pageContent },
  };
};

export default IntegrationPage;

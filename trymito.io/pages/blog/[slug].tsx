
import { PostOrPage } from '@tryghost/content-api';
import Head from 'next/head';
import Image from "next/image";
import { GetStaticProps } from 'next/types';
import { useEffect, useState } from 'react';
import DownloadCTACard from '../../components/CTACards/DownloadCTACard';
import Footer from '../../components/Footer/Footer';
import PageTOC from '../../components/Glossary/PageTOC/PageTOC';
import pageStyles from '../../styles/Page.module.css';
import postStyles from '../../styles/[slug].module.css';
import { getPosts, getSinglePost } from '../../utils/posts';
import { SLUG_REDIRECTS } from '../blog';
import Header from '../../components/Header/Header';
import TwitterLogo from './TwitterLogo';
import EmailIcon from './EmailIcon';
import LinkedinLogo from './LinkedinLogo';
import Link from 'next/link';

import Prism from 'prismjs';
import 'prism-themes/themes/prism-coldark-dark.css'
require('prismjs/components/prism-python');

import { classNames } from '../../utils/classNames';
import { PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_BLOG } from '../../utils/plausible';

declare global {
  interface Window { Prism: any; }
}

// PostPage page component
const PostPage = (props: {post: PostOrPage}) => {
  // Get the current URL for sharing
  let [currentURL, setCurrentURL] = useState<string | undefined>(undefined);
  
  // Render post title and content in the page from props
  useEffect(() => {
    /* 
      Apply prism styling to all of elements that have the class "language-XXXX" 
      (ie: language-python in the CodeBlocks component)

      TODO: Figure out if there is a better place to put this. 
      When it was in the _app.tsx file, the formatting wasn't applied if I navigated to another page and then back to this one.
    */
    Prism.highlightAll();
    setCurrentURL(window.location.href);
  }, []);

  if (!props.post.html) {
    return <div>Not found</div>
  }

  const authorName = props.post.primary_author?.name;
  const publishedAt = props.post.published_at && new Intl.DateTimeFormat('en-US').format(new Date(props.post.published_at));
  const readingTime = props.post.reading_time;
  const suggestedPosts = [
    {
      title: 'Automating Spreadsheets with Python 101',
      description: 'How to tell the difference between a good and bad Python automation target.',
      link: '/blog/automating-spreadsheets-with-python-101'
    },
    {
      title: '10 Mistakes To Look Out For When Transitioning from Excel To Python',
      description: '10 Common Mistakes for new programmers transitioning from Excel to Python',
      link: '/blog/10-mistakes-to-look-out-for-when-transitioning-from-excel-to-python'
    },
    {
      title: 'Research shows Mito speeds up by 400%',
      description: 'We\'re always on the hunt for tools that improve our efficiency at work. Tools that let us accomplish more with less time, money, and resources.',
      link: '/blog/quantifying-mitos-impact-on-analyst-python-productivity'
    },
    {
      title: '3 Rules for Choosing Between SQL and Python',
      description: 'Analysts at the world\'s top banks are automating their manual Excel work so they can spend less time creating baseline reports, and more time building new analyses that push the company forward.',
      link: '/blog/choosing-between-sql-and-python-best-practices-for-data-analytics-workflows'
    }
  ]

  return (
    <>
      {/* Standard Mito header - includes navigation for the website. */}
      <Head>
        <title>{props.post.title} | Mito </title>
        <meta
          name="description"
          content={props.post.meta_description || props.post.excerpt?.slice(0, 99)}
          
          og-image={props.post.feature_image}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />
        
      {/* All blog post related content */}
      <main className={classNames(pageStyles.main, 'blog-content')}>
        <div className={postStyles.post}>
          <div className={postStyles.decorative_line}/>

          {/* Blog Title Banner */}
          <div className={postStyles.post_banner}>
            {/* We use a wrapper around the post title to get the positioning in line with the post content. */}
            <div className={postStyles.post_title}>
              <div className={postStyles.blog_home_container}>
                <Link href='/blog'>
                  <a className={postStyles.blog_home_image_and_text}>
                    <Image src={'/excel-to-python/house.svg'} alt='Home Icon' width={20} height={14} />
                    <p>See more blogs</p>
                  </a>
                </Link>
              </div>
              <h1>{props.post.title}</h1>
              <div className={postStyles.post_metadata}>
                <p>
                  { authorName ? 'By '+ props.post.primary_author?.name: 'The Mito Team' }
                </p>
                {publishedAt && <p className={postStyles.post_additional_info}> {publishedAt}</p>}
                {readingTime && <p className={postStyles.post_additional_info}>{readingTime} min read</p>}
              </div>
            </div>
          </div>

          {/* Table of Contents, post contents, and CTA */}
          <div className={postStyles.post_content_container}>
            {/* Table of Contents */}
            <div className={postStyles.post_toc}>
              <PageTOC />
              <div className={postStyles.post_cta}>
                <DownloadCTACard
                  headerStyle={{
                    fontSize: '1.25rem',
                    color: 'var(--color-light-background-accent)',
                    fontWeight: 'normal'
                  }}
                  buttonContainerStyle={{ paddingTop: '2rem' }}
                />
              </div>
            </div>
            {/* Post Contents */}
            <div className={postStyles.post_content}> 
              <div dangerouslySetInnerHTML={{ __html: props.post.html }}/>
              <div className={postStyles.share_section}>
                <a className={postStyles.tweet_button}
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(props.post.title ?? '')}&url=${encodeURIComponent(currentURL ?? '')}`}>
                  <TwitterLogo />
                </a>
                <a className={postStyles.email_button}
                  href={`mailto:?subject=${encodeURIComponent(props.post.title ?? '')}&body=${encodeURIComponent(currentURL ?? '')}`}>
                    <EmailIcon />
                  </a>
                <a className={postStyles.linkedin_button}
                  href={`https://linkedin.com/shareArticle?title=${encodeURIComponent(props.post.title ?? '')}&url=${encodeURIComponent(currentURL ?? '')}`}>
                    <LinkedinLogo />
                  </a>
              </div>

              {/* Suggested Posts */}
              <div className={postStyles.suggested_posts_section}>
                <h2>More Like This</h2>
                <div className={postStyles.suggested_posts_container}>
                  { suggestedPosts.map((post, index) => {
                    return <Link key={`suggested-post-${index}`} href={post.link}>
                      <a className={postStyles.suggested_post}>
                        <h4>{post.title}</h4>
                        <p>{post.description}</p>
                      </a>
                    </Link>
                  })}
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className={postStyles.post_cta_container}>
              <div className={postStyles.post_cta}>
                <DownloadCTACard 
                  headerStyle={{ fontSize: '1.5rem', color: 'var(--color-light-background-accent)', fontWeight: 'normal' }} 
                  textButtonClassName={PLAUSIBLE_INSTALL_DOCS_CTA_LOCATION_BLOG}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Footer */}
      <Footer />
    </>
  )
}

export async function getStaticPaths() {
  const posts = await getPosts()

  if (!posts) {
    return {
      notFound: true,
    }
  }

  // Get the paths we want to create based on posts
  const paths = posts.map((post) => {
    return {
      params: { slug: post.slug },
    }
  }).concat(Object.keys(SLUG_REDIRECTS).map(key => {
    // Support all the new slug paths as well
    return {
      params: { slug: SLUG_REDIRECTS[key] },
    }
  }))

  // { fallback: false } means posts not found should 404.
  return { paths, fallback: false }
}


// Pass the page slug over to the "getSinglePost" function
// In turn passing it to the posts.read() to query the Ghost Content API
export const getStaticProps: GetStaticProps = async (context) => {
    const slug = context.params?.slug;

    // If the slug is in values of SLUG_REDIRECTS, get it's key for the slug
    // Otherwise, use the slug
    const slugToQuery = Object.keys(SLUG_REDIRECTS).find(key => SLUG_REDIRECTS[key] === slug) || slug;

    const post = slug && await getSinglePost(slugToQuery as string)

    if (!post) {
        return {
        notFound: true,
        }
    }

    return {
        props: { post }
    }
}

export default PostPage;
/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import type { GetStaticProps } from 'next'
import { getPosts } from '../utils/posts'
import { PostOrPage, PostsOrPages } from '@tryghost/content-api'
import Link from 'next/link'
import Footer from '../components/Footer/Footer'
import Head from "next/head";
import Header from '../components/Header/Header'
import pageStyles from '../styles/Page.module.css'
import blogStyles from '../styles/Blog.module.css'

// These are names we could have named better
export const SLUG_REDIRECTS: Record<string, string> = {
  'untitled-3': 'python-spreadsheet-ai-for-enterprise-applications',
  'untitled': 'wall-st-finance-python-spreadsheet-applications',
  'test-post': 'mito-team-5-questions',
  'hello-word': 'hello-world',
}

 
export const getStaticProps: GetStaticProps<{posts: PostsOrPages}> = async () => {
    const posts = await getPosts()

    if (!posts) {
      return {
        notFound: true,
      }
    }

    // Redirect old slugs to new slugs
    posts.forEach(post => {
      if (SLUG_REDIRECTS[post.slug]) {
        post.slug = SLUG_REDIRECTS[post.slug]
      }
    })
  
    return {
      props: { posts },
      revalidate: 60, // Revalidate every 1 minute
    }
}

function getReadingTime(slug: string) {
  // TODO: For some reason, the "reading_time" field is not being returned by the Ghost API
  // so we are calculating it manually for now. Get a hash of the slug, and then return a random
  // number between 4-7
  const hash = slug.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)
  const readingTime = Math.abs(hash % 3) + 4
  return readingTime + " min read"
}

function Post (props: {post: PostOrPage}) {

  return (
    <Link href={"/blog/" + props.post.slug} key={props.post.id}>
      <a>
        <div className={blogStyles.post}>
          <h3>{props.post.title}</h3>
          <p className={blogStyles.excerpt}>
            {props.post.excerpt}...
          </p>
          <div className={blogStyles.post_metadata}>
            <div className={blogStyles.published_at}>
              {props.post.published_at &&
                new Intl.DateTimeFormat('en-US')
                  .format(new Date(props.post.published_at))
              }
            </div>
            <div className={blogStyles.reading_time}>
              - {getReadingTime(props.post.slug)}
            </div>
          </div>

        </div>
      </a>
    </Link>
  )
}
 
export default function Page(props: {posts: PostsOrPages}) {

  return (
    <>
      <Head>
        <title>Blog, FAQs and Resources | Mito </title>
        <meta name="description" content="The Mito blog provides resources for training spreadsheet users on Python, helping Excel users learn Python, and helps your team automate repetative spreadsheet processes. | Mito" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <Header/>
    
      <div className={pageStyles.container}>

          <main className={pageStyles.main}>
            <div className={blogStyles.blog_title}>
              <h1> Mito Blog</h1>
              <p style={{marginTop: '0'}}>The best place to stay up to date with Mito&apos;s development, spreadsheets in Python, and more.</p>
            </div>

            <div className={blogStyles.posts_container}>
              {props.posts.map(post => (
                <Post post={post} key={post.slug} />
              ))}
            </div>            
        </main>

        <Footer />
      </div>
    </>
  )
}
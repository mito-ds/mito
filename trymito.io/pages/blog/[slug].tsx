
import { PostOrPage } from '@tryghost/content-api';
import Head from 'next/head';
import { GetStaticProps } from 'next/types';
import { useEffect } from 'react';
import DownloadCTACard from '../../components/CTACards/DownloadCTACard';
import Footer from '../../components/Footer/Footer';
import Header from '../../components/Header/Header';
import pageStyles from '../../styles/Page.module.css';
import postStyles from '../../styles/[slug].module.css';
import { getPosts, getSinglePost } from '../../utils/posts';
import { SLUG_REDIRECTS } from '../blog';

declare global {
  interface Window { Prism: any; }
}

// PostPage page component
const PostPage = (props: {post: PostOrPage}) => {
  // Render post title and content in the page from props

  useEffect(() => {
    window.Prism.highlightAll();
  }, []);

  if (!props.post.html) {
    return <div>Not found</div>
  }

  const authorName = props.post.primary_author?.name;
  const pulishedAt = props.post.published_at && new Intl.DateTimeFormat('en-US').format(new Date(props.post.published_at));

  return (
    <>
      <Head>
          <title>{props.post.title} | Mito </title>
          <meta
            name="description"
            content={props.post.meta_description || props.post.excerpt?.slice(0, 99)}
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        
        <Header/>
      
        <div className={pageStyles.container}>
          <main className={pageStyles.main}>

            <div className={postStyles.post}>
              <div className={postStyles.post_title}>

                <div className={postStyles.post_metadata}>
                  {authorName &&
                    <p>
                      By {props.post.primary_author?.name}
                    </p>
                  }
                  {!authorName &&
                    <p>
                      The Mito Team
                    </p>
                  }
                  {/* A line with space on either side*/}
                  <p style={{marginLeft: '.5rem', marginRight: '.5rem'}}> - </p>
                  {pulishedAt &&
                    <p>
                      {pulishedAt}
                    </p>
                  }
                </div>
                <h1 style={{marginTop: '0'}}>{props.post.title}</h1>
            </div>
              <div className={postStyles.post_content}>
                <div dangerouslySetInnerHTML={{ __html: props.post.html }} />
              </div>
            </div>

            <section className={pageStyles.background_card}>
              <DownloadCTACard />
            </section>
          </main>
          <Footer />
        </div>
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

import { PostOrPage } from '@tryghost/content-api';
import { getSinglePost, getPosts } from '../../utils/posts';
import { GetStaticProps } from 'next/types';
import Head from 'next/head';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import pageStyles from '../../styles/Page.module.css'
import postStyles from '../../styles/Post.module.css';
import ContactCTACard from '../../components/CTACards/ContactCTACard';
import { useEffect } from 'react';

declare global {
  interface Window { Prism: any; }
}



// PostPage page component
const PostPage = (props: {post: PostOrPage}) => {
  // Render post title and content in the page from props

  if (!props.post.html) {
    return <div>Not found</div>
  }

  const authorName = props.post.primary_author?.name;
  const pulishedAt = props.post.published_at && new Intl.DateTimeFormat('en-US').format(new Date(props.post.published_at));

  useEffect(() => {
    window.Prism.highlightAll();
  }, []);

  return (
    <>
      <Head>
          <title>{props.post.title} | Mito </title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        
        <Header/>
      
        <div className={pageStyles.container}>
          <main className={pageStyles.main}>

            <div className={postStyles.post_content}>
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
              <div dangerouslySetInnerHTML={{ __html: props.post.html }} />
            </div>

            <section className={pageStyles.background_card}>
              <ContactCTACard />
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
  const paths = posts.map((post) => ({
    params: { slug: post.slug },
  }))

  // { fallback: false } means posts not found should 404.
  return { paths, fallback: false }
}


// Pass the page slug over to the "getSinglePost" function
// In turn passing it to the posts.read() to query the Ghost Content API
export const getStaticProps: GetStaticProps = async (context) => {
    console.log(context);
    const slug = context.params?.slug;

    const post = slug && await getSinglePost(slug as string)

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
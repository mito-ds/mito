import { PostOrPage } from '@tryghost/content-api';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header/Header';
import pageStyles from '../styles/Page.module.css';
import { getPosts } from '../utils/ghost';




export const getStaticProps: GetStaticProps = async (context) => {
    const posts = await getPosts()
  
    if (!posts) {
      return {
        notFound: true,
      }
    }
  
    return {
      props: { posts }
    }
}

const IndexPage = (props: {posts: PostOrPage[]}) => (
    <>
        <Head>
            <title>Mito | Home </title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        
        <Header/>
        <div className={pageStyles.container}>
            <main className={pageStyles.main}>

                <ul>
                    {props.posts.map(post => (
                    <li key={post.id}>
                        <Link href={`/blog/${post.slug}`}>
                        <a>{post.title}</a>
                        </Link>
                    </li>
                    ))}
                </ul>
            </main>
        </div>
    </>
);

export default IndexPage;
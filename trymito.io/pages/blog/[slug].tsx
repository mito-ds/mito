// pages/posts/[slug].js

import { PostOrPage } from '@tryghost/content-api';
import { GetStaticProps } from 'next';
import { getSinglePost, getPosts } from '../../utils/ghost';

// PostPage page component
const PostPage = (props: {post: PostOrPage}) => {
  // Render post title and content in the page from props
  return (
    <div>
    
      <h1>{props.post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: props.post.html || '' }} />
    </div>
  )
}

export default PostPage;

export async function getStaticPaths() {
  const posts = await getPosts()

  if (!posts) {
    return;
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
    const slug = context.params?.slug;

    if (!slug) {
        return {
            notFound: true,
        }
    }

    const post = await getSinglePost(slug)

    if (!post) {
        return {
        notFound: true,
        }
    }

    return {
        props: { post }
    }
}
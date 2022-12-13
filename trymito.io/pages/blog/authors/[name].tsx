import { Author } from '@tryghost/content-api';
import { GetStaticProps } from 'next';
import { getAuthor, getAllAuthors } from '../../../utils/ghost';

const AuthorPage = (props: {author: Author}) => {
  return (
    <div>
      <h1>{props.author.name}</h1>
      <div dangerouslySetInnerHTML={{ __html: props.author.bio || '' }} />
    </div>
  )
}

export async function getStaticPaths() {
  const authors = await getAllAuthors()

  if (!authors) {
    return;
  }

  const paths = authors.map((author) => ({
    params: { name: author.name },
  }))

  return { paths, fallback: false }
}


export const getStaticProps: GetStaticProps = async (context) => {
    const name = context.params?.name;
    if (!name) {
        return {
            notFound: true,
        }
    }

    const author = await getAuthor(name)

    if (!author) {
        return {
            notFound: true,
        }
    }

    return {
        props: { author }
    }
}
export default AuthorPage;
import GhostContentAPI from "@tryghost/content-api";


// Create API instance with site credentials
const api = new GhostContentAPI({
  url: 'https://mito-ds.ghost.io',
  key: 'e0593bd5213bd7985c153b8392',
  version: "v5.0"
});

export async function getPosts() {
  return await api.posts
    .browse({
      //include: 'tags,authors', TODO: this is not working
      limit: "all"
    })
    .catch(err => {
      console.error(err);
    });
}

export async function getSinglePost(postSlug: string) {
    return await api.posts
      .read({
        slug: postSlug
      })
      .catch(err => {
        console.error(err);
      });
}

export async function getPages() {
  return await api.pages
    .browse({
      limit: "all"
    })
    .catch(err => {
      console.error(err);
    });
}

export async function getAllAuthors() {
  return await api.authors
    .browse({
      limit: "all"
    })
    .catch(err => {
      console.error(err);
    });
}

export async function getAuthor(authorSlug: string) {
  return await api.authors
    .read({
      slug: authorSlug
    })
    .catch(err => {
      console.error(err);
    });
}
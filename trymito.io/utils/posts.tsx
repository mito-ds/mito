/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import GhostContentAPI from "@tryghost/content-api";


// Create API instance with site credentials
const api = new GhostContentAPI({
    url: 'https://mito-ds.ghost.io',
    key: 'e0593bd5213bd7985c153b8392',
    version: "v5.0"
});

export async function getPosts() {
    const posts = await api.posts
      .browse({
        fields: ["id", "title", "slug", "published_at", "primary_author", "excerpt", "primary_author"],
        include: ["tags", "authors"],
        limit: "all"
      })
      .catch(err => {
        console.error(err);
      });

    return posts;
}

export async function getSinglePost(postSlug: string) {
  const post = await api.posts
    .read({
      slug: postSlug,
    },)
    .catch(err => {
      console.error(err);
    });

  return post;
}
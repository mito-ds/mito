//pages/sitemap.xml.js
// Dynamically generate a sitemap.xml file for our site following
// https://nextjs.org/learn-pages-router/seo/crawling-and-indexing/xml-sitemaps

import { getGlossaryPageInfo, getPageContentJsonArray } from '../utils/excel-to-python';
import { getPosts } from '../utils/posts';
import { SLUG_REDIRECTS } from './blog';

const WEBSITE_HOST_URL = 'https://trymito.io';

function generateSiteMap(glossarySlugs: string[], blogPostSlugs: string[]) {
    return `<?xml version="1.0" encoding="UTF-8"?>
        <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
            <!--We manually set the two URLs we know already-->
            <url>
                <loc>https://www.trymito.io/</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/plans</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/spreadsheet-automation</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/python-ai-tools</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/low-code-sql</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/data-app</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/infrastructure-integration-python-tool</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/use-cases/python-training</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/industries/financial-services</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/industries/life-sciences</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/customers</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/security</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/blog</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/excel-to-python</loc>
            </url>
            <url>
                <loc>https://www.trymito.io/teams</loc>
            </url>
            ${glossarySlugs.map(glossarySlug => {
                return `
                <url>
                    <loc>${`${WEBSITE_HOST_URL}/excel-to-python/${glossarySlug}`}</loc>
                </url>
                `;
            }).join('')}
            ${blogPostSlugs.map(blogPostSlug => {
                return `
                <url>
                    <loc>${`${WEBSITE_HOST_URL}/blog/${blogPostSlug}`}</loc>
                </url>
                `;
            }).join('')}
        </urlset>
    `;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
  // TODO: Understand why this function is needed for the build to succeed
}

export const getServerSideProps = async ({res}: any) => {
    // Get the glossary pages
    const pageContentsJsonArray = await getPageContentJsonArray()
    const glossaryPageInfo = await getGlossaryPageInfo(pageContentsJsonArray)
    const glossarySlugs = glossaryPageInfo.map((pageInfo) => pageInfo.slug.join('/'))

    // Get the blog pages
    const blogPostSlugs: string[] = []
    const posts = await getPosts()
    if (posts) {
        // Redirect old slugs to new slugs
        posts.forEach(post => {
            if (SLUG_REDIRECTS[post.slug]) {
                blogPostSlugs.push(SLUG_REDIRECTS[post.slug])
            } else {
                blogPostSlugs.push(post.slug)
            }
        })
    }

    // We generate the XML sitemap with the posts data
    const sitemap = generateSiteMap(glossarySlugs, blogPostSlugs);

    res.setHeader('Content-Type', 'text/xml');
    // we send the XML to the browser
    res.write(sitemap);
    res.end();

    return {
        props: {},
    };
    
}


export default SiteMap;
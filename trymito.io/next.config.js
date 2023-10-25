/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/quantifying-mitos-impact-on-analyst-python-productivity/',
        destination: 'https://www.trymito.io/blog/quantifying-mitos-impact-on-analyst-python-productivity/',
        permanent: true,
      },
    ];
  },
}

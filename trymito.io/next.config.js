/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,

  async redirects() {
    return [
      {
        source: '/:path*', // Match any path on the old blog URL
        has: [
          {
            type: 'host',
            value: 'blog.trymito.io', // Specify the old blog host
          },
        ],
        permanent: true, // 301 redirect is permanent
        destination: 'https://trymito.io/blog/:path*', // Redirect to the new blog path, preserving the path
      },
    ]
  },
}

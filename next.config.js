/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  // Served behind the enabledby.cloud CloudFront router at /apps/system-design-canvas;
  // the Lambda@Edge router (enabledby-cloud/routing) rewrites that prefix to this
  // repo's own GitHub Pages path before forwarding to the origin, but every
  // absolute asset URL the browser requests must already carry this prefix so
  // CloudFront's /apps/:name path pattern matches it in the first place.
  // Must stay in sync with the appMap key in enabledby-cloud/routing's
  // src/cloudfront-lambda-edge.js.
  basePath: '/apps/system-design-canvas',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  distDir: 'out',
};

module.exports = nextConfig;

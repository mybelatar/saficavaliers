import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/mobile',
        destination: '/manager',
        permanent: false
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: '/manager',
        destination: '/mobile'
      }
    ];
  },
  turbopack: {
    root: __dirname
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**'
      }
    ]
  }
};

export default nextConfig;

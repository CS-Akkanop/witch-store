/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'cdn.jakethewitcher.shop',
                port: '',        // optional, leave empty if default
                pathname: '/**'  // allow all paths under this domain
            }
        ]
    }
};

export default nextConfig;

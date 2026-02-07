/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is enabled by default in Next.js 14
  experimental: {
    // Server Actions are enabled by default in Next.js 14
    serverComponentsExternalPackages: ["@coral-xyz/anchor"],
  },

  // Image configuration
  images: {
    domains: [
      "localhost",
      "*.vercel.app",
      // Solana RPC/CDN domains
      "api.mainnet-beta.solana.com",
      "api.devnet.solana.com",
      "rpc.helius.xyz",
      // IPFS gateways
      "ipfs.io",
      "gateway.ipfs.io",
      "cloudflare-ipfs.com",
      // Arweave
      "arweave.net",
      // Image hosting
      "cdn.discordapp.com",
      "pbs.twimg.com",
      "abs.twimg.com",
      "i.imgur.com",
      "imgur.com",
      "*.googleusercontent.com",
      "*.amazonaws.com",
      // NFT metadata
      "nftstorage.link",
      "dweb.link",
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },

  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || "0.1.0",
  },

  // Redirects
  async redirects() {
    return [
      // Legacy API route redirects (maintained for backward compatibility)
      {
        source: "/api/trains/:path*",
        destination: "/api/tokens/:path*",
        permanent: true,
      },
      // Legacy page redirects
      {
        source: "/train/:address",
        destination: "/token/:address",
        permanent: true,
      },
      {
        source: "/create-train",
        destination: "/create",
        permanent: true,
      },
    ];
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },

  // Webpack configuration for Solana dependencies
  webpack: (config, { isServer }) => {
    // Handle Node.js polyfills for browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    // Handle bigint serialization
    config.module.rules.push({
      test: /\.m?js$/,
      type: "javascript/auto",
    });

    return config;
  },

  // ESLint configuration
  eslint: {
    // Run ESLint on these directories during production builds
    dirs: ["src"],
  },

  // TypeScript configuration
  typescript: {
    // Ignore build errors in development for faster builds
    ignoreBuildErrors: process.env.NODE_ENV === "development",
  },

  // Output configuration
  output: "standalone",

  // Powered by header
  poweredByHeader: false,

  // React strict mode
  reactStrictMode: true,
};

module.exports = nextConfig;

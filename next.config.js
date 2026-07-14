/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Native/binary Node modules that must not be bundled by webpack — they
  // must remain external and be resolved at runtime on the Node.js server.
  experimental: {
    serverComponentsExternalPackages: [
      "@node-rs/argon2",
      "@prisma/client",
      "pdf-parse",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        "@node-rs/argon2",
        "@node-rs/argon2-linux-x64-gnu",
        "@node-rs/argon2-linux-x64-musl",
        "@node-rs/argon2-linux-arm64-gnu",
        "@node-rs/argon2-linux-arm64-musl",
        "@node-rs/argon2-darwin-x64",
        "@node-rs/argon2-darwin-arm64",
        "@node-rs/argon2-win32-x64-msvc",
      ];
    }
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't externalize @sparticuz/chromium-min so it gets bundled
  serverExternalPackages: ["puppeteer-core"],

  // Force-include chromium files in the serverless function bundle
  outputFileTracingIncludes: {
    "/app/api/vercfunctions/route": [
      "./node_modules/@sparticuz/chromium-min/**",
      "./node_modules/@sparticuz/chromium-min/bin/**",
      "./node_modules/@sparticuz/chromium-min/**/*.br",
      "./node_modules/@sparticuz/chromium-min/**/*.tar.gz",
    ],
  },

  // Webpack configuration to handle chromium binaries
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't externalize @sparticuz/chromium-min - we want it bundled
      config.externals = config.externals.filter(
        (external: any) => external !== '@sparticuz/chromium-min'
      );
      
      // Add module alias for better resolution
      config.resolve.alias = {
        ...config.resolve.alias,
        '@sparticuz/chromium-min': require.resolve('@sparticuz/chromium-min'),
      };
    }
    return config;
  },
};

export default nextConfig;

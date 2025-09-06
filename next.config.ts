import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't externalize @sparticuz/chromium so it gets bundled
  serverExternalPackages: ["puppeteer-core"],

  // Force-include chromium files in the serverless function bundle
  outputFileTracingIncludes: {
    "/app/api/vercfunctions/route": [
      "./node_modules/@sparticuz/chromium/bin/**",
      "./node_modules/@sparticuz/chromium/**/*.br",
    ],
  },

  // Webpack configuration to handle chromium binaries
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't externalize @sparticuz/chromium - we want it bundled
      config.externals = config.externals.filter(
        (external: any) => external !== '@sparticuz/chromium'
      );
    }
    return config;
  },
};

export default nextConfig;

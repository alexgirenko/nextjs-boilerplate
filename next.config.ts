import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure these native deps aren't bundled incorrectly
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

  // Force-include ALL chromium files in the serverless function bundle
  // Use more aggressive file inclusion to ensure binaries are bundled
  outputFileTracingIncludes: {
    "/app/api/vercfunctions/route": [
      "./node_modules/@sparticuz/chromium/**/*",
      "./node_modules/@sparticuz/chromium-min/**/*",
    ],
  },

  // Webpack configuration to handle chromium binaries
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        '@sparticuz/chromium': '@sparticuz/chromium',
      });
    }
    return config;
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure these native deps aren't bundled incorrectly
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

  // Force-include ALL chromium files in the serverless function bundle
  outputFileTracingIncludes: {
    "/app/api/vercfunctions/route": [
      "./node_modules/@sparticuz/chromium/**/*",
    ],
  },
};

export default nextConfig;

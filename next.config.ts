import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure these native deps aren't bundled incorrectly
  serverExternalPackages: ["chrome-aws-lambda", "puppeteer-core"],

  // Force-include ALL chrome-aws-lambda files in the serverless function bundle
  outputFileTracingIncludes: {
    "/app/api/vercfunctions/route": [
      "./node_modules/chrome-aws-lambda/**/*",
    ],
  },
};

export default nextConfig;

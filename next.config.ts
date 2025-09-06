import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure these native deps aren't bundled incorrectly
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],

  // Force-include Chromium's bin assets in the serverless function bundle
  // so the brotli files exist at runtime on Vercel
  outputFileTracingIncludes: {
    "/app/api/vercfunctions/route": [
      "./node_modules/@sparticuz/chromium/bin/**",
      "./node_modules/@sparticuz/chromium/**"
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure these native deps aren't bundled incorrectly
  serverExternalPackages: ["@sparticuz/chromium-min", "puppeteer-core"],

  // Force-include Chromium's bin assets in the serverless function bundle
  // so the brotli files exist at runtime on Vercel

  outputFileTracingIncludes: {
    "/app/api/vercfunctions/route": [
      "./node_modules/@sparticuz/chromium-min/bin/**",
      "./node_modules/@sparticuz/chromium-min/**"
    ],
  },
};

export default nextConfig;

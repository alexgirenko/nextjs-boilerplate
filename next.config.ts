import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Simple config since we're using Browserless.io remote browser
  serverExternalPackages: ["puppeteer-core"],
};

export default nextConfig;

import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    exposeTestingApiInProductionBuild: process.env.INSTANT_E2E === "1",
    // Keep dynamic page segments in client cache for 30 seconds.
    staleTimes: { dynamic: 30 },
    // TypeScript 7 supplies tsc; TypeScript 6 supplies API used by Next and ESLint.
    useTypeScriptCli: false,
  },
  reactCompiler: true,
  transpilePackages: ["shiki"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/chat",
        permanent: false,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
});

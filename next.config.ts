import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    exposeTestingApiInProductionBuild: process.env.INSTANT_E2E === "1",
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

export default nextConfig;

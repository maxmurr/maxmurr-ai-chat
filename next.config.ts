import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
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

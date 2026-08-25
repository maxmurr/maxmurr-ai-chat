import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

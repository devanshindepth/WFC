import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  },
};

export default nextConfig;

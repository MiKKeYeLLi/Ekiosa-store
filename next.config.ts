import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to be reached through Cloudflare quick tunnels (dev only).
  allowedDevOrigins: ["*.trycloudflare.com"],
};

export default nextConfig;

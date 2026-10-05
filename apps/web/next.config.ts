import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Monorepo root (two levels up), so Turbopack and file tracing can reach packages/shared.
const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

const nextConfig: NextConfig = {
  // Allow the dev server to be reached through Cloudflare quick tunnels (dev only).
  allowedDevOrigins: ["*.trycloudflare.com"],
  // packages/shared ships TypeScript source.
  transpilePackages: ["@ekiosa/shared"],
  turbopack: { root: workspaceRoot },
  outputFileTracingRoot: workspaceRoot,
};

export default nextConfig;

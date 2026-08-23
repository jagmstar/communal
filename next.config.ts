import type { NextConfig } from "next";

/**
 * When MOBILE_BUILD=true:
 *   - Static export to dist/ (for Capacitor Android app)
 *   - API routes are excluded (native app fetches from Vercel backend)
 * When MOBILE_BUILD is not set (default / Vercel):
 *   - Normal Next.js build with API routes (server-side)
 */
const isMobileBuild = process.env.MOBILE_BUILD === "true";

const nextConfig: NextConfig = {
  ...(isMobileBuild
    ? { output: "export", distDir: "dist" }
    : {}),
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

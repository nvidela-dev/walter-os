import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  // Authenticated pages must never survive sign-out in a shared device cache.
  cacheStartUrl: false,
  dynamicStartUrl: false,
  runtimeCaching: [{ urlPattern: /.*/, handler: "NetworkOnly" }],
});

const nextConfig: NextConfig = {
  // Empty turbopack config to silence warning (next-pwa uses webpack)
  turbopack: {},
};

export default withPWA(nextConfig);

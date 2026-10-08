import type { MetadataRoute } from "next";

import { t } from "@/i18n";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/inventory", name: t.inventory.title, short_name: t.inventory.title,
    description: t.inventory.description, start_url: "/inventory", scope: "/inventory",
    display: "standalone", background_color: "#ffffff", theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

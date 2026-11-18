import type { MetadataRoute } from "next";

// Android のホーム画面用。/manifest.webmanifest として配信される。
// アイコンは元の絵 src/app/icon.svg から app-icons.mjs が作る（app-icons.json）。手で置き換えない
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ScriptStudio",
    short_name: "ScriptStudio",
    theme_color: "#ffffff",
    background_color: "#ffffff",
    display: "standalone",
    start_url: "/",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "StudyHub — Academic Resource Sharing",
        short_name: "StudyHub",
        description: "Share, discover, and study academic resources powered by AI.",
        theme_color: "#0f0f1a",
        background_color: "#0f0f1a",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "https://res.cloudinary.com/dfnpgl0bb/image/upload/w_192,h_192,c_fill,q_auto,f_png/v1754714276/ChatGPT_Image_Aug_9_2025_10_06_49_AM_eo8uck.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "https://res.cloudinary.com/dfnpgl0bb/image/upload/w_512,h_512,c_fill,q_auto,f_png/v1754714276/ChatGPT_Image_Aug_9_2025_10_06_49_AM_eo8uck.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts", expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "cloudinary-images", expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import alchemy from "alchemy/cloudflare/tanstack-start";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    alchemy(),
    VitePWA({
      registerType: 'autoUpdate',
      filename: 'pwa-worker.js',
      includeAssets: ['favicon.ico', 'robots.txt', '*.png'],
      manifest: {
        name: "Fizzy Timer",
        short_name: "Fizzy",
        description: "Track time on your Fizzy tasks with a companion that matches your mood.",
        id: "fizzy-timer-focus-timer",
        start_url: "/?source=pwa",
        display: "standalone",
        display_override: ["standalone", "window-controls-overlay"],
        background_color: "#050505",
        theme_color: "#f59e0b",
        orientation: "portrait",
        categories: ["productivity", "utilities"],
        prefer_related_applications: false,
        icons: [
          { src: "/icons/icon-72.png", sizes: "72x72", type: "image/png", purpose: "any" },
          { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png", purpose: "any" },
          { src: "/icons/icon-128.png", sizes: "128x128", type: "image/png", purpose: "any" },
          { src: "/icons/icon-144.png", sizes: "144x144", type: "image/png", purpose: "any" },
          { src: "/icons/icon-152.png", sizes: "152x152", type: "image/png", purpose: "any" },
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-256.png", sizes: "256x256", type: "image/png", purpose: "any" },
          { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ],
        shortcuts: [
          { name: "Start Focus", short_name: "Focus", description: "Start a focus session", url: "/", icons: [{ src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" }] },
          { name: "History", short_name: "History", description: "View your session history", url: "/history", icons: [{ src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" }] },
          { name: "Reports", short_name: "Reports", description: "View your productivity reports", url: "/report", icons: [{ src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" }] }
        ],
        launch_handler: { client_mode: ["navigate-new", "auto"] },
        related_applications: [],
        scope: "/",
        lang: "en-US",
        dir: "ltr"
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}", "pwa-worker.js"],
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/(focus|history|report|setup)/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "convex-api-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.giphy\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "giphy-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          },
          {
            urlPattern: /^https:\/\/media\d*\.giphy\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "giphy-media-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          },
          {
            urlPattern: /\.(?:js|css|woff2|png|jpg|jpeg|svg|ico)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-assets-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          }
        ]
      },
      devOptions: { enabled: true }
    })
  ],
  server: {
    port: 3001,
  },
});

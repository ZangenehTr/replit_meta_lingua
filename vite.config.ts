import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { VitePWA } from "vite-plugin-pwa";
import type { ManualChunksOption } from "rollup";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "images/*.png", "images/*.jpg", "offline.html"],
      manifest: {
        name: "متا لینگوا آکادمی",
        short_name: "Meta Lingua",
        description: "پلتفرم یادگیری زبان هوشمند - AI-Powered Language Learning Platform",
        theme_color: "#7c3aed",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/?source=pwa",
        categories: ["education", "productivity"],
        lang: "fa",
        dir: "rtl",
        icons: [
          { src: "/pwa-192x192.png", sizes: "72x72",   type: "image/png", purpose: "any" },
          { src: "/pwa-192x192.png", sizes: "96x96",   type: "image/png", purpose: "any" },
          { src: "/pwa-192x192.png", sizes: "128x128", type: "image/png", purpose: "any" },
          { src: "/pwa-192x192.png", sizes: "144x144", type: "image/png", purpose: "any" },
          { src: "/pwa-192x192.png", sizes: "152x152", type: "image/png", purpose: "any" },
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "384x384", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          {
            name: "دوره‌های من",
            short_name: "My Courses",
            description: "دسترسی سریع به دوره‌های زبانی",
            url: "/student-courses?source=pwa-shortcut",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "LinguaQuest",
            short_name: "LinguaQuest",
            description: "بازی یادگیری زبان",
            url: "/lingua-quest?source=pwa-shortcut",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "CallerN — آموزش زنده",
            short_name: "CallerN",
            description: "تماس ویدیویی با مدرس",
            url: "/callerN?source=pwa-shortcut",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        globIgnores: ["**/node_modules/**/*", "**/dist/**/*"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        navigateFallback: "/offline.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/api\/.*$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 10,
              cacheableResponse: { statuses: [0, 200] },
              backgroundSync: {
                name: "api-sync-queue",
                options: {
                  maxRetentionTime: 24 * 60,
                },
              },
            },
          },
          {
            urlPattern: /\/images\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tabs", "@radix-ui/react-tooltip"],
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});

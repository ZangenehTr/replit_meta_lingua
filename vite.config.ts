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
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "images/*.png", "images/*.jpg", "offline.html"],
      manifest: {
        name: "متالینگوآ — Meta Lingua",
        short_name: "متالینگوآ",
        description: "پلتفرم یادگیری زبان هوشمند — AI-Powered Language Learning Platform",
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
          { src: "/pwa-72x72.png",             sizes: "72x72",   type: "image/png", purpose: "any" },
          { src: "/pwa-96x96.png",             sizes: "96x96",   type: "image/png", purpose: "any" },
          { src: "/pwa-128x128.png",           sizes: "128x128", type: "image/png", purpose: "any" },
          { src: "/pwa-144x144.png",           sizes: "144x144", type: "image/png", purpose: "any" },
          { src: "/pwa-152x152.png",           sizes: "152x152", type: "image/png", purpose: "any" },
          { src: "/pwa-192x192.png",           sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-384x384.png",           sizes: "384x384", type: "image/png", purpose: "any" },
          { src: "/pwa-512x512.png",           sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-maskable-72x72.png",    sizes: "72x72",   type: "image/png", purpose: "maskable" },
          { src: "/pwa-maskable-96x96.png",    sizes: "96x96",   type: "image/png", purpose: "maskable" },
          { src: "/pwa-maskable-128x128.png",  sizes: "128x128", type: "image/png", purpose: "maskable" },
          { src: "/pwa-maskable-144x144.png",  sizes: "144x144", type: "image/png", purpose: "maskable" },
          { src: "/pwa-maskable-152x152.png",  sizes: "152x152", type: "image/png", purpose: "maskable" },
          { src: "/pwa-maskable-192x192.png",  sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/pwa-maskable-384x384.png",  sizes: "384x384", type: "image/png", purpose: "maskable" },
          { src: "/pwa-maskable-512x512.png",  sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          {
            name: "دوره‌های من",
            short_name: "My Courses",
            description: "دسترسی سریع به دوره‌های زبانی",
            url: "/student/courses?source=pwa-shortcut",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "LinguaQuest",
            short_name: "LinguaQuest",
            description: "بازی یادگیری زبان",
            url: "/linguaquest?source=pwa-shortcut",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "CallerN — آموزش زنده",
            short_name: "CallerN",
            description: "تماس ویدیویی با مدرس",
            url: "/callern?source=pwa-shortcut",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        globIgnores: ["**/node_modules/**/*", "**/dist/**/*", "**/sw.js", "**/workbox-*.js"],
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
        type: "module",
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
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "wouter",
      "@tanstack/react-query",
      "framer-motion",
      "react-i18next",
      "i18next",
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-select",
      "@radix-ui/react-popover",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
    ],
    force: false,
  },
  server: {
    warmup: {
      clientFiles: [
        "./src/main.tsx",
        "./src/App.tsx",
        "./src/pages/public/home.tsx",
        "./src/hooks/use-auth.ts",
        "./src/lib/queryClient.ts",
      ],
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
});

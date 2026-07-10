import { defineConfig } from "vite";
import { miaodaDevPlugin } from "miaoda-sc-plugin";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path";

import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    miaodaDevPlugin(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'AtuStoka POS',
        short_name: 'AtuStoka',
        description: 'AtuStoka Point of Sale System',
        theme_color: '#166534',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/bn2s03zsnx8h\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});

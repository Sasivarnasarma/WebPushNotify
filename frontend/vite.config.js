import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      manifest: {
        name: 'WebPushNotify',
        short_name: 'WebPush',
        description: 'Web Push Notification Admin Panel',
        theme_color: '#0ea5e9',
        icons: [
          {
            src: 'bell-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'bell-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  envPrefix: ["API_"],
  server: {
    port: 5173
  }
});

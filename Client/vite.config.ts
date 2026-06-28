import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: 'generateSW',
        registerType: 'prompt',
        injectRegister: 'auto',
        includeAssets: ['pwa-icon.svg', 'pwa-icon-192.png', 'pwa-icon-512.png'],
        manifest: {
          name: "Queue Cure '26 - Clinic Standby",
          short_name: "Queue Cure",
          description: "Clinic triage and waiting room queue management for patients and reception staff.",
          id: "/",
          start_url: "/",
          scope: "/",
          display: "standalone",
          display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
          orientation: "portrait",
          background_color: "#f8fafc",
          theme_color: "#0d9488",
          categories: ["health", "medical", "productivity"],
          icons: [
            {
              src: "/pwa-icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: "/pwa-icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: "/pwa-icon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any maskable"
            }
          ],
          shortcuts: [
            {
              name: "Patient Tracker",
              short_name: "Patient",
              url: "/patient",
              icons: [
                {
                  src: "/pwa-icon-192.png",
                  sizes: "192x192",
                  type: "image/png"
                }
              ]
            },
            {
              name: "Reception Desk",
              short_name: "Reception",
              url: "/reception-login",
              icons: [
                {
                  src: "/pwa-icon-192.png",
                  sizes: "192x192",
                  type: "image/png"
                }
              ]
            },
            {
              name: "Waiting Display",
              short_name: "Display",
              url: "/display",
              icons: [
                {
                  src: "/pwa-icon-192.png",
                  sizes: "192x192",
                  type: "image/png"
                }
              ]
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/socket\.io\//],
          runtimeCaching: [
            {
              urlPattern: /^\/api\//,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^\/socket\.io\//,
              handler: 'NetworkOnly',
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

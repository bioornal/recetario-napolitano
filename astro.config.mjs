// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import astroPwa from '@vite-pwa/astro';
import netlify from '@astrojs/netlify';

export default defineConfig({
  output: 'server',
  adapter: netlify(),
  integrations: [
    astroPwa({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: {
        name: 'El Fogon — Dashboard Pizzería',
        short_name: 'El Fogon',
        description: 'Gestión profesional de pizzería napolitana',
        theme_color: '#1a1410',
        background_color: '#1a1410',
        display: 'standalone',
        icons: [
          { src: '/favicon.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: '/favicon.svg', sizes: '512x512', type: 'image/svg+xml' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{css,js,svg,png,ico,txt}'],
        runtimeCaching: [{
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-cache',
            networkTimeoutSeconds: 3,
          },
        }],
      }
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});

// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import astroPwa from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  integrations: [
    astroPwa({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      manifest: {
        name: 'Calculadora de Masa Napolitana',
        short_name: 'Recetario',
        description: 'Herramienta profesional de pizzería',
        theme_color: '#1a1410',
        background_color: '#1a1410',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt}']
      }
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
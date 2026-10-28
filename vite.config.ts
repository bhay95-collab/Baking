import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: "Hay's Crust & Crumb",
        short_name: 'Crust & Crumb',
        description: 'Private recipe scaler and ratio workbench.',
        theme_color: '#4A3628',
        background_color: '#EFE8DE',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,woff,woff2,json}'] },
    }),
  ],
  test: { include: ['tests/**/*.test.ts'] },
});

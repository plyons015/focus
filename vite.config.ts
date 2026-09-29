import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.png'],
      manifest: {
        name: 'ZigZag Neurodivergent Planner',
        short_name: 'ZigZag',
        description: 'Add it where it goes, then do the one Now.',
        start_url: '/',
        display: 'standalone',
        background_color: '#f3efe6',
        theme_color: '#1f4d5c',
        icons: [
          { src: 'icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

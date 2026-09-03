import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon-192.png', 'icon-512.png', 'screenshot-desktop.png', 'screenshot-mobile.png'],
        manifest: {
          name: 'إدارة الموظفين',
          short_name: 'إدارة الموظفين',
          description: 'نظام إدارة العمال في إدارة الموظفين الإلكتروني',
          theme_color: '#4f46e5',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: '/',
          id: '/',
          dir: 'rtl',
          lang: 'ar',
          orientation: 'portrait-primary',
          categories: ['business', 'productivity', 'finance'],
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ],
          screenshots: [
            {
              src: '/screenshot-desktop.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide'
            },
            {
              src: '/screenshot-mobile.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow'
            }
          ],
          shortcuts: [
            {
              name: 'لوحة التحكم',
              short_name: 'الرئيسية',
              description: 'العودة إلى لوحة التحكم',
              url: '/',
              icons: [{ src: '/icon-192.png', sizes: '192x192' }]
            }
          ]
        }
      })
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
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide';
              }
              if (id.includes('recharts')) {
                return 'vendor-recharts';
              }
              if (id.includes('@google/genai')) {
                return 'vendor-genai';
              }
              return 'vendor';
            }
          }
        }
      }
    }
  };
});

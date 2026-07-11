/* global process */
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      // port: 5173,
      host: true,
      open: true,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: env.VITE_API_URL,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false, // Désactive les source maps en production
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Le helper interne de Vite pour les imports dynamiques (utilisé par
            // TOUS les React.lazy()) doit rester avec un chunk toujours-eager,
            // sinon Rollup le loge dans un chunk lazy (ex. vendor-pdf) et l'entrée
            // finit par l'importer statiquement pour l'obtenir — rendant ce chunk eager.
            if (id.includes('vite/preload-helper')) return 'vendor-react';
            if (!id.includes('node_modules')) return;
            if (id.includes('react-router')) return 'vendor-router';
            if (/[\\/]react(-dom)?[\\/]|scheduler/.test(id)) return 'vendor-react';
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('dompurify')) return 'vendor-pdf';
            if (id.includes('framer-motion')) return 'vendor-motion';
            if (id.includes('@reduxjs') || id.includes('react-redux')) return 'vendor-redux';
            // Pas de fallback générique ici : ça forcerait Rollup à fusionner du code
            // async-only (ex. dépendances de jsPDF) avec du code eager, et le tout
            // deviendrait eager. On laisse Rollup chunker le reste automatiquement.
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  }
})

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    'process.env': {
      APP_NAME: JSON.stringify('Médecin')
    }
  },
  build: {
    // Ignorer les avertissements comme erreurs pendant le build
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignorer les avertissements spécifiques liés aux assets
        if (warning.code === 'MISSING_EXPORT' || 
            warning.code === 'UNRESOLVED_IMPORT' || 
            warning.message.includes('Could not load')) {
          return;
        }
        warn(warning);
      }
    }
  }
})
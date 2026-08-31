import crypto from 'node:crypto'
if (!crypto.hash) {
  crypto.hash = (alg, data, out) => crypto.createHash(alg).update(data).digest(out)
}
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/@vue/') || id.includes('node_modules/vue')) {
              return 'vue'
            }

            if (id.includes('primevue/')) {
              const match = id.match(/primevue\/([^/]+)/)
              return match ? `primevue-${match[1]}` : 'primevue'
            }

            if (id.includes('@primeuix/themes/')) {
              const match = id.match(/@primeuix\/themes\/([^/]+)/)
              return match ? `primeuix-${match[1]}` : 'primeuix'
            }

            if (id.includes('heic-to')) {
              return 'heic-to'
            }

            if (id.includes('axios')) {
              return 'axios'
            }

            return 'vendor'
          }
        },
      },
    },
  },
})

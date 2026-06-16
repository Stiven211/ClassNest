import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
   server: {
    port: 7890, 
    open: true, // Abre el navegador automáticamente cuando inicia el servidor
  },

  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react'
            if (id.includes('@radix-ui')) return 'vendor-ui'
            if (id.includes('xlsx')) return 'vendor-xlsx'
          }
          return undefined
        },
      },
    },
  },
})
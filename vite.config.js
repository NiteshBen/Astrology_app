import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: { kundli: 'index.html', today: 'today.html' },
    },
  },
})

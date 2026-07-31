import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.MP4', '**/*.mp4'],
  server: {
    proxy: {
      // Faqat DEV uchun: localhost'da backend media (mept.webster.uz/media/…)
      // cross-origin bo'ladi va CORS header bo'lmagani uchun canvasga chizib
      // base64'ga aylantirib bo'lmaydi. Productionда sayt media bilan bir xil
      // domenda turadi, shuning uchun bu proxy ishlatilmaydi (aiProctor.js
      // origin bir xil bo'lsa rasmni to'g'ridan-to'g'ri oladi).
      '/media-proxy': {
        target: 'https://mept.webster.uz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/media-proxy/, '/media'),
      },
    },
  },
  build: {
    // 'hidden': .map fayllar hosil bo'ladi, lekin bundle ichida URL ko'rsatilmaydi
    // (hajmi/maxfiyligi deyarli o'zgarmaydi). Telegram'dagi stack'ni dekod qilish uchun.
    sourcemap: 'hidden',
  },
})

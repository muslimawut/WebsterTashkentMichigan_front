import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.MP4', '**/*.mp4'],
  build: {
    // 'hidden': .map fayllar hosil bo'ladi, lekin bundle ichida URL ko'rsatilmaydi
    // (hajmi/maxfiyligi deyarli o'zgarmaydi). Telegram'dagi stack'ni dekod qilish uchun.
    sourcemap: 'hidden',
  },
})

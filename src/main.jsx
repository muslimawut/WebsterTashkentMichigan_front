import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { reportErrorToTelegram } from './utils/telegram'

// Bizning kodimizdan kelmaydigan "shovqin" xatolar — brauzer kengaytmalari,
// parol-menejer/autofill va in-app brauzerlar inject qiladi.
// Bular actionable emas, shuning uchun Telegramga yubormaymiz.
const NOISE_PATTERNS = [
  '_AutofillCallbackHandler',               // mobil autofill / parol menejer
  'ResizeObserver loop',                    // benign brauzer ogohlantirishi
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  'safari-web-extension://',
  'instantSearchSDKJSBridgeClearHighlight', // iOS in-app brauzer
  'window.webkit.messageHandlers',
]

const isIgnorableError = (message, details) => {
  const haystack = `${message || ''} ${details || ''}`
  return NOISE_PATTERNS.some((p) => haystack.includes(p))
}

// Global: kutilmagan JS xatoliklari (crash) ni Telegramga yuboramiz
window.addEventListener('error', (event) => {
  // Cross-origin script'lardan keladigan foydasiz "Script error." larni o'tkazib yuboramiz
  // (masalan Yandex.Metrika / Google Analytics — tafsilot bo'lmaydi: ":0:0")
  const isCrossOriginNoise =
    event.message === 'Script error.' ||
    (!event.error && !event.filename && !event.lineno)
  if (isCrossOriginNoise) return

  const message = event.message || 'Kutilmagan xatolik'
  const details = event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`
  if (isIgnorableError(message, details)) return

  reportErrorToTelegram({ message, details })
})

// Global: ushlanmagan promise rejection'lar
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  const message = reason?.message || 'Ushlanmagan promise xatosi'
  const details = reason?.stack || String(reason)
  if (isIgnorableError(message, details)) return

  reportErrorToTelegram({ message, details })
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
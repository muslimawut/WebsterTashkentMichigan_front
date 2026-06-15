import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { reportErrorToTelegram } from './utils/telegram'

// Global: kutilmagan JS xatoliklari (crash) ni Telegramga yuboramiz
window.addEventListener('error', (event) => {
  reportErrorToTelegram({
    message: event.message || 'Kutilmagan xatolik',
    details: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
  })
})

// Global: ushlanmagan promise rejection'lar
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  reportErrorToTelegram({
    message: reason?.message || 'Ushlanmagan promise xatosi',
    details: reason?.stack || String(reason),
  })
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
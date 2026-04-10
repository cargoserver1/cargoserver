if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/base.css'
import './styles/layout.css'
import './styles/public.css'
import './styles/landing.css'
import './styles/console.css'
import './styles/chat.css'
import './styles/responsive.css'
import './styles/transport-status.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

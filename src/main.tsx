import './utils/storageCleanup'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { I18nProvider } from './i18n/I18nProvider.tsx'

import { GoogleOAuthProvider } from '@react-oauth/google'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'default-client-id'}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
)

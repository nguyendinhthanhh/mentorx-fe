import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Defensive check for corrupted localStorage
try {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const parsed = JSON.parse(authStorage);
    if (parsed?.state?.accessToken === 'undefined' || parsed?.state?.accessToken === 'null') {
      localStorage.removeItem('auth-storage');
      window.location.reload();
    }
  }
} catch (e) {
  localStorage.removeItem('auth-storage');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

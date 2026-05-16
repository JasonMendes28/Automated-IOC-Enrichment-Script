import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d1f3c',
            color: '#e2f0ff',
            border: '1px solid #1a3a5c',
            fontFamily: 'IBM Plex Sans, sans-serif',
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)

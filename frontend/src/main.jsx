import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 2500,
        style: { borderRadius: 12, padding: '12px 16px', fontSize: 14 },
        success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
        error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
      }}
    />
  </React.StrictMode>,
)

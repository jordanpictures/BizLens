import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'

// Intercept all fetch requests to inject the JWT token automatically
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const [url, options = {}] = args;
  
  if (typeof url === 'string' && url.startsWith('/api')) {
    const token = localStorage.getItem('token');
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
  }
  
  const response = await originalFetch(url, options);
  
  // Optional: Auto-logout on 401 Unauthorized if it's not the login endpoint
  if (response.status === 401 && !url.includes('/auth/login')) {
    localStorage.removeItem('token');
    window.location.href = '/';
  }
  
  return response;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
)

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';

// Interceptor Fetch Global untuk menyertakan token autentikasi JWT pada setiap panggilan API
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers = new Headers(init.headers || {});
  
  // Otomatis lampirkan header Authorization jika token tersedia dan belum diset
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await originalFetch(input, { ...init, headers });

  // Tangani sesi kedaluwarsa atau token tidak valid (401 Unauthorized)
  if (response.status === 401) {
    const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
    const isAuthRoute = urlStr.includes('/api/auth/login') || urlStr.includes('/api/auth/register') || urlStr.includes('/api/auth/verify-otp') || urlStr.includes('/api/auth/send-register-otp');
    if (!isAuthRoute) {
      console.warn('[Auth] Sesi telah berakhir. Mengarahkan ke login...');
      localStorage.removeItem('token');
      localStorage.setItem('isLoggedIn', 'false');
    }
  }

  return response;
};

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);

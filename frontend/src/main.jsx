import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider as JsxAuthProvider } from './context/AuthContext.jsx';
import { AuthProvider as TsxAuthProvider } from './auth/auth.context.tsx';
import { LayoutProvider } from './app/providers/LayoutProvider.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <JsxAuthProvider>
        <TsxAuthProvider>
          <LayoutProvider>
            <App />
          </LayoutProvider>
        </TsxAuthProvider>
      </JsxAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

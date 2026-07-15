import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App.jsx';
import { AdminProvider } from './components/AdminContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AdminProvider>
      <App />
    </AdminProvider>
  </StrictMode>,
);



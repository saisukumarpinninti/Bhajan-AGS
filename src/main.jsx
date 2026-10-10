import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/style.css';
import App from '../bhajan_mandali.tsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

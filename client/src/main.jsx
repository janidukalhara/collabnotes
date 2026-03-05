import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';
import 'quill/dist/quill.snow.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            borderRadius: '10px',
            background: '#221f1a',
            color: '#f7f6f3',
          },
          success: { iconTheme: { primary: '#5e8f66', secondary: '#f7f6f3' } },
          error:   { iconTheme: { primary: '#dc2626', secondary: '#f7f6f3' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);

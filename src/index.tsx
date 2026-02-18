import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Initialize Telegram WebApp before React mount
// ready() tells Telegram the app is ready to render (stops loading spinner)
// expand() fills the full screen height instead of partial sheet
// @ts-ignore — Telegram WebApp global injected via SDK script
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

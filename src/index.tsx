import React from 'react';

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import ReactDOM from 'react-dom/client';

import './index.css';
import App from './App';
import { initSentry } from './lib/sentry';
import reportWebVitals from './reportWebVitals';

initSentry();

// Configure status bar on native platforms
if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Light });
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

reportWebVitals(import.meta.env.DEV ? console.log : undefined);

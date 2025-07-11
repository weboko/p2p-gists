import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
// Initialize Prism early
import './lib/prism.js'

// Handle GitHub Pages SPA redirect
const handleGitHubPagesRedirect = () => {
  // Only handle redirects if we're on GitHub Pages and have the redirect query parameter
  if (window.location.hostname === 'weboko.github.io' && window.location.search.startsWith('?/')) {
    const redirect = window.location.search.slice(2).replace(/~and~/g, '&');
    const newUrl = window.location.pathname + (redirect ? '/' + redirect : '') + window.location.hash;
    window.history.replaceState(null, null, newUrl);
  }
};

// Run the redirect handler on page load
handleGitHubPagesRedirect();

// Determine basename based on environment
const basename = window.location.hostname === 'weboko.github.io' ? '/p2p-gists' : '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
) 
import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useTheme } from './hooks/useTheme.js';
import { useIdentity } from './hooks/useIdentity.js';
import { initDatabase } from './lib/database.js';
import { initWaku } from './lib/waku.js';
import Layout from './components/Layout.jsx';
import CreateSnippet from './components/CreateSnippet.jsx';
import ViewSnippet from './components/ViewSnippet.jsx';
import NotFound from './components/NotFound.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';

function App() {
  const { isLoading: themeLoading } = useTheme();
  const { isLoading: identityLoading } = useIdentity();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const location = useLocation();

  // Initialize application
  useEffect(() => {
    const initApp = async () => {
      try {
        console.log('Initializing P2P Gists app...');
        
        // Initialize database
        await initDatabase();
        console.log('Database initialized');
        
        // Initialize Waku (non-blocking)
        initWaku().catch(error => {
          console.warn('Waku initialization failed:', error);
          // Don't block app initialization if Waku fails
        });
        
        setIsInitialized(true);
        console.log('App initialized successfully');
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setInitError(error.message);
      }
    };

    if (!themeLoading && !identityLoading) {
      initApp();
    }
  }, [themeLoading, identityLoading]);

  // Show loading screen while initializing
  if (themeLoading || identityLoading || !isInitialized) {
    return <LoadingScreen error={initError} />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<CreateSnippet />} />
        <Route path="/s/:hash" element={<ViewSnippet />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App; 
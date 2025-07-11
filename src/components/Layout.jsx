import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';
import { useIdentity } from '../hooks/useIdentity.js';
import { getNetworkStats } from '../lib/waku.js';
import ThemeToggle from './ThemeToggle.jsx';
import IdentityModal from './IdentityModal.jsx';
import { cn } from '../lib/utils.js';

// SVG Icons
const CodeIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const NetworkIcon = ({ connected }) => (
  <svg className={cn("w-4 h-4", connected ? "text-green-500" : "text-gray-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default function Layout({ children }) {
  const { isDark } = useTheme();
  const { identity } = useIdentity();
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [networkStats, setNetworkStats] = useState({ connected: false, peers: 0 });
  const location = useLocation();

  // Update network stats periodically
  React.useEffect(() => {
    const updateStats = () => {
      const stats = getNetworkStats();
      setNetworkStats(stats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const isCreatePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="flex items-center justify-center w-8 h-8 bg-primary-600 rounded-lg group-hover:bg-primary-700 transition-colors">
                  <CodeIcon />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    P2P Gists
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Secure Code Sharing
                  </p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-4">
              {/* New Snippet Button */}
              {!isCreatePage && (
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  <PlusIcon />
                  <span className="ml-2 hidden sm:block">New Snippet</span>
                </Link>
              )}

              {/* Network Status */}
              <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-dark-700 rounded-md">
                <NetworkIcon connected={networkStats.connected} />
                <span className="hidden sm:block">
                  {networkStats.connected ? `${networkStats.peers} peers` : 'Connecting...'}
                </span>
              </div>

              {/* Identity Button */}
              <button
                onClick={() => setShowIdentityModal(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-md transition-colors"
                title="Manage Identity"
              >
                <UserIcon />
                <span className="hidden sm:block">
                  {identity?.nickname || 'Loading...'}
                </span>
              </button>

              {/* Theme Toggle */}
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-dark-800 border-t border-gray-200 dark:border-dark-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              P2P Gists - Secure, peer-to-peer code snippet sharing
            </p>
            <p className="mt-2">
              End-to-end encrypted • No accounts required • Privacy-first
            </p>
          </div>
        </div>
      </footer>

      {/* Identity Modal */}
      {showIdentityModal && (
        <IdentityModal
          onClose={() => setShowIdentityModal(false)}
        />
      )}
    </div>
  );
} 